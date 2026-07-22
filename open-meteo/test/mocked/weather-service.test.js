const {
  getWeatherByPlace,
  weatherDescription,
} = require("../../src/weather-service");
const { jsonResponse } = require("../support/responses");

function completeForecast() {
  return {
    timezone: "Europe/London",
    current_units: {
      temperature_2m: "°C",
      wind_speed_10m: "km/h",
    },
    daily_units: {
      temperature_2m_max: "°C",
      precipitation_sum: "mm",
    },
    current: {
      time: "2026-07-22T12:00",
      temperature_2m: 17.4,
      apparent_temperature: 16.8,
      weather_code: 3,
      wind_speed_10m: 12.5,
    },
    daily: {
      time: ["2026-07-22", "2026-07-23"],
      weather_code: [3, 1],
      temperature_2m_max: [19.1, 21.2],
      temperature_2m_min: [12.4, 13.2],
      precipitation_sum: [0.4, 0],
    },
  };
}

describe("weather-by-place journey", () => {
  it("uses the selected geocoded coordinates to build a concise forecast profile", async () => {
    const client = {
      searchPlaces: jest.fn().mockResolvedValue(
        jsonResponse({
          results: [
            {
              name: "London",
              country: "United Kingdom",
              admin1: "England",
              latitude: 51.5085,
              longitude: -0.1257,
              elevation: 14,
              population: 8982000,
            },
          ],
        }),
      ),
      getForecast: jest
        .fn()
        .mockResolvedValue(jsonResponse(completeForecast())),
    };

    await expect(getWeatherByPlace(client, " London ")).resolves.toEqual({
      location: {
        name: "London",
        country: "United Kingdom",
        administrativeArea: "England",
        coordinates: { latitude: 51.5085, longitude: -0.1257 },
        timezone: "Europe/London",
        elevationMetres: 14,
        population: 8982000,
      },
      units: {
        temperature: "°C",
        windSpeed: "km/h",
        precipitation: "mm",
      },
      current: {
        observedAt: "2026-07-22T12:00",
        conditions: "Overcast",
        temperature: 17.4,
        apparentTemperature: 16.8,
        weatherCode: 3,
        windSpeed: 12.5,
      },
      dailyForecast: [
        {
          date: "2026-07-22",
          conditions: "Overcast",
          weatherCode: 3,
          highTemperature: 19.1,
          lowTemperature: 12.4,
          precipitation: 0.4,
        },
        {
          date: "2026-07-23",
          conditions: "Mainly clear",
          weatherCode: 1,
          highTemperature: 21.2,
          lowTemperature: 13.2,
          precipitation: 0,
        },
      ],
    });
    expect(client.searchPlaces).toHaveBeenCalledWith("London");
    expect(client.getForecast).toHaveBeenCalledWith({
      latitude: 51.5085,
      longitude: -0.1257,
    });
  });

  it("translates weather codes into readable conditions", () => {
    expect(weatherDescription(95)).toBe("Thunderstorm");
    expect(weatherDescription(777)).toBe("Weather code 777");
  });

  it("does not request a forecast when no location matches", async () => {
    const client = {
      searchPlaces: jest.fn().mockResolvedValue(jsonResponse({ results: [] })),
      getForecast: jest.fn(),
    };

    await expect(getWeatherByPlace(client, "Atlantis")).rejects.toThrow(
      'No location found for "Atlantis".',
    );
    expect(client.getForecast).not.toHaveBeenCalled();
  });

  it("rejects blank input before making an API request", async () => {
    const client = { searchPlaces: jest.fn() };

    await expect(getWeatherByPlace(client, " ")).rejects.toThrow(
      "Enter a place name",
    );
    expect(client.searchPlaces).not.toHaveBeenCalled();
  });

  it("maps forecast failures without exposing the upstream response body", async () => {
    const client = {
      searchPlaces: jest.fn().mockResolvedValue(
        jsonResponse({
          results: [{ name: "London", latitude: 51.5, longitude: -0.1 }],
        }),
      ),
      getForecast: jest
        .fn()
        .mockResolvedValue(
          new Response("internal diagnostic", { status: 503 }),
        ),
    };

    await expect(getWeatherByPlace(client, "London")).rejects.toThrow(
      'Could not retrieve the weather forecast for "London" (HTTP 503).',
    );
  });

  it("rejects incomplete parallel daily data", async () => {
    const client = {
      searchPlaces: jest.fn().mockResolvedValue(
        jsonResponse({
          results: [{ name: "London", latitude: 51.5, longitude: -0.1 }],
        }),
      ),
      getForecast: jest.fn().mockResolvedValue(
        jsonResponse({
          ...completeForecast(),
          daily: { ...completeForecast().daily, precipitation_sum: [0.4] },
        }),
      ),
    };

    await expect(getWeatherByPlace(client, "London")).rejects.toThrow(
      "Open-Meteo returned an incomplete daily forecast.",
    );
  });
});
