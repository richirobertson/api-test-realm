const {
  colorizeJson,
  formatJson,
  markWeatherValues,
} = require("../../src/formatters");

describe("weather JSON formatter", () => {
  it("marks location and contextual values for semantic highlighting", () => {
    expect(
      markWeatherValues({
        name: "London",
        country: "United Kingdom",
        timezone: "Europe/London",
        conditions: "Overcast",
      }),
    ).toEqual({
      name: "\uE001London\uE001",
      country: "\uE000United Kingdom\uE000",
      timezone: "\uE000Europe/London\uE000",
      conditions: "\uE000Overcast\uE000",
    });
  });

  it("keeps the location and contextual values visibly distinct", () => {
    const output = colorizeJson(
      JSON.stringify(
        markWeatherValues({
          name: "London",
          country: "United Kingdom",
          timezone: "Europe/London",
          conditions: "Overcast",
        }),
      ),
      true,
    );
    const colours = output
      .split("\u001B[38;2;")
      .slice(1)
      .map((segment) => segment.split("m")[0]);

    expect(output).toContain('\u001B[1;38;2;255;145;0m"London"');
    expect(colours).toHaveLength(3);
    expect(new Set(colours).size).toBe(3);
  });

  it("keeps non-interactive output valid JSON", () => {
    expect(
      JSON.parse(formatJson({ name: "London", conditions: "Overcast" }, false)),
    ).toEqual({ name: "London", conditions: "Overcast" });
  });
});
