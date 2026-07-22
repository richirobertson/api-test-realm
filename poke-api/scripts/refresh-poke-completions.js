const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { baseUrl, requestTimeoutMs } = require("../src/config");

const resources = ["pokemon", "move", "type", "region"];
const cacheRoot = path.join(
  process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"),
  "poke-api-realm",
);
const cacheFile = path.join(cacheRoot, "completions.tsv");

async function fetchNames(resource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`${baseUrl}/${resource}?limit=100000`, {
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`PokéAPI returned ${response.status} for ${resource}.`);
    const payload = await response.json();
    return payload.results.map(({ name }) => name);
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshCompletions() {
  const entries = await Promise.all(
    resources.map(async (resource) => [resource, await fetchNames(resource)]),
  );
  const lines = entries.flatMap(([resource, names]) =>
    names.map((name) => `${resource}\t${name}`),
  );

  await fs.mkdir(cacheRoot, { recursive: true });
  await fs.writeFile(cacheFile, `${lines.join("\n")}\n`);
  console.log(`Saved ${lines.length} completion suggestions to ${cacheFile}`);
}

refreshCompletions().catch((error) => {
  console.error(`Could not refresh completion suggestions: ${error.message}`);
  process.exitCode = 1;
});
