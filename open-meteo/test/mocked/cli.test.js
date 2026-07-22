const { run } = require("../../src/cli");
const { jsonResponse } = require("../support/responses");

test("weather CLI joins a multi-word place and prints its curated profile", async () => {
  const stdout = jest.fn();
  const client = {
    searchPlaces: jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            name: "New York",
            country: "United States",
            latitude: 40.7,
            longitude: -74,
          },
        ],
      }),
    ),
    getForecast: jest.fn().mockResolvedValue(
      jsonResponse({
        timezone: "America/New_York",
        current: {},
        daily: {
          time: [],
          weather_code: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          precipitation_sum: [],
        },
      }),
    ),
  };

  await expect(
    run(["New", "York"], {
      client,
      stdout,
      stderr: jest.fn(),
      canRenderWeatherSymbol: () => false,
    }),
  ).resolves.toBe(0);

  expect(client.searchPlaces).toHaveBeenCalledWith("New York");
  expect(stdout).toHaveBeenCalledWith(expect.stringContaining('"timezone"'));
});

test("weather CLI renders the matching local weather symbol above its JSON", async () => {
  const stdout = jest.fn();
  const renderSymbol = jest.fn().mockReturnValue("weather-symbol");
  const client = {
    searchPlaces: jest.fn().mockResolvedValue(
      jsonResponse({
        results: [{ name: "London", latitude: 51.5, longitude: -0.1 }],
      }),
    ),
    getForecast: jest.fn().mockResolvedValue(
      jsonResponse({
        timezone: "Europe/London",
        current: { weather_code: 95 },
        daily: {
          time: [],
          weather_code: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          precipitation_sum: [],
        },
      }),
    ),
  };

  await expect(
    run(["London"], {
      client,
      stdout,
      stderr: jest.fn(),
      canRenderWeatherSymbol: () => true,
      renderSymbol,
    }),
  ).resolves.toBe(0);

  expect(renderSymbol).toHaveBeenCalledWith(95);
  expect(stdout).toHaveBeenNthCalledWith(1, "weather-symbol");
  expect(stdout).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining('"conditions": "Thunderstorm"'),
  );
});

test("weather CLI renders service errors as readable JSON", async () => {
  const stderr = jest.fn();

  await expect(run([], { stdout: jest.fn(), stderr })).resolves.toBe(0);
  await expect(run([" "], { stdout: jest.fn(), stderr })).resolves.toBe(1);

  expect(stderr).toHaveBeenCalledWith(
    expect.stringContaining("Enter a place name"),
  );
});
