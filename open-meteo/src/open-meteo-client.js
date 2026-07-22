function createOpenMeteoClient({
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
    getForecast: ({ latitude, longitude }) =>
      get(
        buildUrl(forecastBaseUrl, "forecast", {
          latitude,
          longitude,
          current:
            "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
          forecast_days: "3",
          timezone: "auto",
        }),
      ),
  };
}

module.exports = { createOpenMeteoClient };
