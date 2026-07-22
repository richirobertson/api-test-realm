const {
  weatherAssetForCode,
  weatherAssetPath,
} = require("../../src/weather-image-renderer");

describe("weather symbol selection", () => {
  it.each([
    [0, "clear.svg"],
    [3, "cloudy.svg"],
    [45, "fog.svg"],
    [63, "rain.svg"],
    [75, "snow.svg"],
    [95, "thunder.svg"],
  ])("maps WMO code %i to %s", (code, asset) => {
    expect(weatherAssetForCode(code)).toBe(asset);
    expect(weatherAssetPath(code)).toContain(`assets/weather/${asset}`);
  });
});
