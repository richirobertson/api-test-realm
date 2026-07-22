const { spawnSync } = require("node:child_process");

// Render remote official artwork as ANSI/Unicode characters through the optional Chafa binary.
async function renderThumbnail(
  imageUrl,
  { fetchImplementation = fetch, width = 24, height = 12 } = {},
) {
  const probe = spawnSync("chafa", ["--version"], { encoding: "utf8" });
  if (probe.error) {
    throw new Error(
      "Image rendering requires Chafa. Install it with: brew install chafa",
    );
  }

  const response = await fetchImplementation(imageUrl);
  if (!response.ok)
    throw new Error(`Artwork download failed (HTTP ${response.status}).`);

  const image = Buffer.from(await response.arrayBuffer());
  const rendered = spawnSync("chafa", [`--size=${width}x${height}`, "-"], {
    input: image,
    encoding: "utf8",
  });
  if (rendered.error || rendered.status !== 0)
    throw new Error("Chafa could not render the artwork.");
  return rendered.stdout;
}

function isChafaAvailable() {
  return !spawnSync("chafa", ["--version"], { encoding: "utf8" }).error;
}

module.exports = { renderThumbnail, isChafaAvailable };
