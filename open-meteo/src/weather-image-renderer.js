const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

function weatherAssetForCode(code) {
  if ([0, 1].includes(code)) return "clear.svg";
  if ([2, 3].includes(code)) return "cloudy.svg";
  if ([45, 48].includes(code)) return "fog.svg";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow.svg";
  if ([95, 96, 99].includes(code)) return "thunder.svg";
  return "rain.svg";
}

function weatherAssetPath(code) {
  return join(__dirname, "..", "assets", "weather", weatherAssetForCode(code));
}

function renderWeatherSymbol(code, { width = 18, height = 9 } = {}) {
  const rendered = spawnSync(
    "chafa",
    [`--size=${width}x${height}`, weatherAssetPath(code)],
    { encoding: "utf8" },
  );
  if (rendered.error || rendered.status !== 0)
    throw new Error("Chafa could not render the weather symbol.");
  return rendered.stdout;
}

function isChafaAvailable() {
  return !spawnSync("chafa", ["--version"], { encoding: "utf8" }).error;
}

module.exports = {
  isChafaAvailable,
  renderWeatherSymbol,
  weatherAssetForCode,
  weatherAssetPath,
};
