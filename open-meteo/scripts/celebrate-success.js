const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const gifPath = join(__dirname, "..", "assets", "test-success.gif");

// A celebration should never turn a successful test run into a failed command.
if (!existsSync(gifPath)) {
  console.log("All tests passed. Success GIF is unavailable.");
  process.exit(0);
}

const chafa = spawnSync("chafa", ["--size=36x18", "--animate=on", gifPath], {
  stdio: "inherit",
});

if (chafa.error) {
  console.log(
    "All tests passed. Install Chafa to render the sunshine celebration: brew install chafa",
  );
}
