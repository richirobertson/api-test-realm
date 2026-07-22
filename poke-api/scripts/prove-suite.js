#!/usr/bin/env node

// This is a curated demonstration that tests can detect a known defect.
// It is intentionally manual-only and never runs as part of the normal test suite.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const pc = require("picocolors");

const projectRoot = path.resolve(__dirname, "..");
const applicationPath = path.join(projectRoot, "src", "app.js");
const jestPath = path.join(
  projectRoot,
  "node_modules",
  "jest",
  "bin",
  "jest.js",
);
const expectedResponse = "res.status(200).json({ status: 'ok' });";
const deliberatelyBrokenResponse =
  "res.status(200).json({ status: 'unhealthy' });";

// Keep the demonstration easy to follow without hiding the underlying test details.
const divider = () => console.log(pc.dim("─".repeat(72)));
const step = (number, message) =>
  console.log(`${pc.cyan(`${number}.`)} ${message}`);

// Keep the original bytes so the application is restored exactly, even if Jest fails unexpectedly.
const originalApplication = fs.readFileSync(applicationPath);
const originalSource = originalApplication.toString("utf8");

if (!fs.existsSync(jestPath)) {
  console.error(
    "Test proof could not start: install dependencies with npm install first.",
  );
  process.exit(1);
}

if (originalSource.split(expectedResponse).length !== 2) {
  console.error(
    "Test proof could not safely apply its known mutation; src/app.js does not have the expected health response.",
  );
  process.exit(1);
}

let testResult;
const resultPath = path.join(
  os.tmpdir(),
  `api-test-realm-proof-${process.pid}.json`,
);

try {
  // Introduce one narrow, documented defect. The health test should reject this response body.
  fs.writeFileSync(
    applicationPath,
    originalSource.replace(expectedResponse, deliberatelyBrokenResponse),
  );

  console.log();
  divider();
  console.log(pc.bold("TEST SUITE PROOF"));
  console.log(
    "A safe, manual check that one contract test can detect a known defect.",
  );
  divider();
  step("1", `Temporarily change ${pc.bold("GET /health")}`);
  console.log(`   Expected response: ${pc.green('{ status: "ok" }')}`);
  console.log(`   Deliberate defect:  ${pc.red('{ status: "unhealthy" }')}`);
  step("2", `Run ${pc.bold("test/mocked/app.test.js")} only`);
  step(
    "3",
    `Expect Jest to ${pc.yellow("fail")} because the contract has been broken`,
  );
  console.log();

  testResult = spawnSync(
    process.execPath,
    [
      jestPath,
      "test/mocked/app.test.js",
      "--runInBand",
      "--verbose",
      "--json",
      `--outputFile=${resultPath}`,
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );
} finally {
  // Always restore the working source before reporting the proof result.
  fs.writeFileSync(applicationPath, originalApplication);
  console.log(
    `\n${pc.green("✓")} Source restored: ${pc.bold("src/app.js")} is back to its original state.`,
  );
}

if (testResult.error) {
  console.error(`\nTest proof could not run: ${testResult.error.message}`);
  process.exit(1);
}

let jestResult;

try {
  jestResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
} catch {
  console.error(
    "\nTest proof did not receive a valid Jest result, so it cannot confirm the expected failure.",
  );
  process.exit(1);
} finally {
  fs.rmSync(resultPath, { force: true });
}

if (testResult.status !== 0 && jestResult.numFailedTests > 0) {
  console.log();
  divider();
  console.log(pc.green(pc.bold("✓ PROOF PASSED — EXPECTED FAILURE OBSERVED")));
  console.log(
    "The health-contract test rejected the deliberately incorrect response.",
  );
  console.log(
    "The Jest failure shown above is therefore the evidence that this test is working.",
  );
  console.log("No source changes were kept.");
  divider();
  process.exit(0);
}

console.error();
divider();
console.error(pc.red(pc.bold("✗ PROOF FAILED — MUTATION SURVIVED")));
console.error(
  "The health-contract test passed even though its response was deliberately made incorrect.",
);
console.error(
  "Strengthen the test before relying on it to protect this contract.",
);
console.error("No source changes were kept.");
divider();
process.exit(1);
