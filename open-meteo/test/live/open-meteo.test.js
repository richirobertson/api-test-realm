const {
  archiveBaseUrl,
  forecastBaseUrl,
  geocodingBaseUrl,
  requestTimeoutMs,
} = require("../../src/config");
const { createOpenMeteoClient } = require("../../src/open-meteo-client");

jest.setTimeout(requestTimeoutMs * 3);

const client = createOpenMeteoClient({
  archiveBaseUrl,
  geocodingBaseUrl,
  forecastBaseUrl,
  timeoutMs: requestTimeoutMs,
});

function expectAlignedDailySeries(daily) {
  const fields = [
    daily.time,
    daily.weather_code,
    daily.temperature_2m_max,
    daily.temperature_2m_min,
    daily.precipitation_sum,
  ];

  expect(daily.time.length).toBeGreaterThan(0);
  fields.forEach((field) => {
    expect(field).toHaveLength(daily.time.length);
  });

  daily.time.forEach((date, index) => {
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (index) expect(date > daily.time[index - 1]).toBe(true);
  });
}

describe("Open-Meteo live integration", () => {
  let london;

  beforeAll(async () => {
    const response = await client.searchPlaces("London");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
    const body = await response.json();
    london = body.results?.find(
      (candidate) =>
        candidate.name === "London" && candidate.country_code === "GB",
    );
    expect(london).toEqual(
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        timezone: expect.any(String),
      }),
    );
  });

  it("returns a documented forecast contract for a geocoded location", async () => {
    const response = await client.getForecast(london);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
    const forecast = await response.json();

    expect(forecast).toEqual(
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        timezone: expect.any(String),
        current: expect.objectContaining({
          time: expect.any(String),
          temperature_2m: expect.any(Number),
          apparent_temperature: expect.any(Number),
          weather_code: expect.any(Number),
          wind_speed_10m: expect.any(Number),
        }),
        daily: expect.any(Object),
      }),
    );
    expect(forecast.timezone).toBe(london.timezone);
    expect(Math.abs(forecast.latitude - london.latitude)).toBeLessThan(0.2);
    expect(Math.abs(forecast.longitude - london.longitude)).toBeLessThan(0.2);
    expectAlignedDailySeries(forecast.daily);
  });

  it("rejects impossible latitude values", async () => {
    const response = await client.getForecast({ latitude: 91, longitude: 0 });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
  });

  it("returns one forecast object per requested location with explicit units and timezone", async () => {
    const response = await client.getForecast({
      latitude: "51.5085,40.7128",
      longitude: "-0.1257,-74.006",
      temperatureUnit: "fahrenheit",
      windSpeedUnit: "mph",
      timezone: "Europe/London",
      forecastDays: "2",
    });

    expect(response.status).toBe(200);
    const forecasts = await response.json();
    expect(forecasts).toHaveLength(2);
    forecasts.forEach((forecast) => {
      expect(forecast.timezone).toBe("Europe/London");
      expect(forecast.current_units).toEqual(
        expect.objectContaining({
          temperature_2m: "°F",
          wind_speed_10m: "mp/h",
        }),
      );
      expectAlignedDailySeries(forecast.daily);
    });
  });

  it("returns a historical daily time series for a closed past date range", async () => {
    const response = await client.getHistoricalWeather({
      latitude: london.latitude,
      longitude: london.longitude,
      startDate: "2024-01-01",
      endDate: "2024-01-03",
      timezone: "Europe/London",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
    const historical = await response.json();
    expect(historical.timezone).toBe("Europe/London");
    expect(historical.daily_units).toEqual(
      expect.objectContaining({
        temperature_2m_max: "°C",
        temperature_2m_min: "°C",
        precipitation_sum: "mm",
      }),
    );
    expect(historical.daily.time).toEqual([
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
    ]);
    expect(historical.daily.temperature_2m_max).toHaveLength(3);
    expect(historical.daily.temperature_2m_min).toHaveLength(3);
    expect(historical.daily.precipitation_sum).toHaveLength(3);
  });
});
