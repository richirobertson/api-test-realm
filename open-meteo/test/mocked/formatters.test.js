const { formatError, formatWeather } = require("../../src/formatters");

describe("weather terminal formatter", () => {
  const weather = {
    location: {
      name: "London",
      country: "United Kingdom",
      timezone: "Europe/London",
      coordinates: { latitude: 51.5, longitude: -0.1 },
    },
    units: { temperature: "°C", windSpeed: "km/h", precipitation: "mm" },
    current: {
      observedAt: "2026-07-24T12:00",
      conditions: "Overcast",
      temperature: 18,
      apparentTemperature: 17,
      windSpeed: 12,
    },
    dailyForecast: [
      {
        date: "2026-07-24",
        conditions: "Overcast",
        highTemperature: 20,
        lowTemperature: 13,
        precipitation: 1.2,
      },
    ],
  };

  it("renders a structured current-conditions card and forecast", () => {
    const output = formatWeather(weather, false);

    expect(output).toContain("☀  London, United Kingdom");
    expect(output).toContain("Overcast   18°C");
    expect(output).toContain("Feels like 17°C  •  Wind 12 km/h");
    expect(output).toContain("3-day forecast");
    expect(output).toContain("2026-07-24");
    expect(output).toContain("20°C");
    expect(output).not.toContain('{"location"');
  });

  it("uses visible placeholders for missing optional values", () => {
    expect(
      formatWeather(
        {
          location: { name: "London" },
          current: {},
          dailyForecast: [],
        },
        false,
      ),
    ).toContain("Forecast unavailable");
  });

  it("renders a concise labelled error", () => {
    expect(formatError("No location found.", false)).toBe(
      "✖ Weather unavailable\n  No location found.",
    );
  });
});
