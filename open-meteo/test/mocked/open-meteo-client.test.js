const { createOpenMeteoClient } = require("../../src/open-meteo-client");
const { jsonResponse } = require("../support/responses");

const options = {
  archiveBaseUrl: "https://archive.example/v1",
  geocodingBaseUrl: "https://geocoding.example/v1",
  forecastBaseUrl: "https://forecast.example/v1",
  timeoutMs: 50,
  retries: 1,
};

describe("Open-Meteo client: deterministic transport behaviour", () => {
  it("builds the documented geocoding and forecast requests", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(jsonResponse({}));
    const client = createOpenMeteoClient({ ...options, fetchImplementation });

    await client.searchPlaces("New York");
    await client.getForecast({ latitude: 40.7128, longitude: -74.006 });

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      "https://geocoding.example/v1/search?name=New+York&count=5&language=en&format=json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      "https://forecast.example/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m%2Capparent_temperature%2Cweather_code%2Cwind_speed_10m&daily=weather_code%2Ctemperature_2m_max%2Ctemperature_2m_min%2Cprecipitation_sum&forecast_days=3&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("retries a transient transport failure once", async () => {
    const fetchImplementation = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce(jsonResponse({}));
    const client = createOpenMeteoClient({ ...options, fetchImplementation });

    await client.searchPlaces("London");

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("does not retry an upstream HTTP response", async () => {
    const fetchImplementation = jest
      .fn()
      .mockResolvedValue(new Response("Service unavailable", { status: 503 }));
    const client = createOpenMeteoClient({ ...options, fetchImplementation });

    const response = await client.searchPlaces("London");

    expect(response.status).toBe(503);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("supports explicit units, multi-location coordinates, and historical dates", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(jsonResponse({}));
    const client = createOpenMeteoClient({ ...options, fetchImplementation });

    await client.getForecast({
      latitude: "51.5,40.7",
      longitude: "-0.1,-74",
      temperatureUnit: "fahrenheit",
      windSpeedUnit: "mph",
      timezone: "Europe/London",
      forecastDays: "2",
    });
    await client.getHistoricalWeather({
      latitude: 51.5,
      longitude: -0.1,
      startDate: "2024-01-01",
      endDate: "2024-01-03",
      timezone: "Europe/London",
    });

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      "https://forecast.example/v1/forecast?latitude=51.5%2C40.7&longitude=-0.1%2C-74&current=temperature_2m%2Capparent_temperature%2Cweather_code%2Cwind_speed_10m&daily=weather_code%2Ctemperature_2m_max%2Ctemperature_2m_min%2Cprecipitation_sum&forecast_days=2&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=Europe%2FLondon",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      "https://archive.example/v1/archive?latitude=51.5&longitude=-0.1&start_date=2024-01-01&end_date=2024-01-03&daily=temperature_2m_max%2Ctemperature_2m_min%2Cprecipitation_sum&timezone=Europe%2FLondon",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
