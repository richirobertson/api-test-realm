const { createOpenMeteoClient } = require("../../src/open-meteo-client");
const { jsonResponse } = require("../support/responses");

const options = {
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
      "https://forecast.example/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m%2Capparent_temperature%2Cweather_code%2Cwind_speed_10m&daily=weather_code%2Ctemperature_2m_max%2Ctemperature_2m_min%2Cprecipitation_sum&forecast_days=3&timezone=auto",
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
});
