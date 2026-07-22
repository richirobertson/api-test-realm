function createOpenMeteoClient({
  archiveBaseUrl,
  geocodingBaseUrl,
  forecastBaseUrl,
  fetchImplementation = fetch,
  timeoutMs = 10_000,
  retries = 1,
}) {
  async function get(url) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        return await fetchImplementation(url, { signal: controller.signal });
      } catch (error) {
        lastError = error;
        if (attempt === retries) throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  function buildUrl(baseUrl, path, parameters) {
    const url = new URL(path, `${baseUrl.replace(/\/$/, "")}/`);
    Object.entries(parameters).forEach(([name, value]) =>
      url.searchParams.set(name, value),
    );
    return url.toString();
  }

  return {
    searchPlaces: (name) =>
      get(
        buildUrl(geocodingBaseUrl, "search", {
          name,
          count: "5",
          language: "en",
          format: "json",
        }),
      ),
    getForecast: ({
      latitude,
      longitude,
      temperatureUnit = "celsius",
      windSpeedUnit = "kmh",
      timezone = "auto",
      forecastDays = "3",
    }) =>
      get(
        buildUrl(forecastBaseUrl, "forecast", {
          latitude,
          longitude,
          current:
            "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
          forecast_days: forecastDays,
          temperature_unit: temperatureUnit,
          wind_speed_unit: windSpeedUnit,
          timezone,
        }),
      ),
    getHistoricalWeather: ({
      latitude,
      longitude,
      startDate,
      endDate,
      timezone,
    }) =>
      get(
        buildUrl(archiveBaseUrl, "archive", {
          latitude,
          longitude,
          start_date: startDate,
          end_date: endDate,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
          timezone,
        }),
      ),
  };
}

module.exports = { createOpenMeteoClient };
