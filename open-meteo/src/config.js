const geocodingBaseUrl =
  process.env.OPEN_METEO_GEOCODING_URL ||
  "https://geocoding-api.open-meteo.com/v1";
const forecastBaseUrl =
  process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1";
const archiveBaseUrl =
  process.env.OPEN_METEO_ARCHIVE_URL || "https://archive-api.open-meteo.com/v1";
const requestTimeoutMs = 10_000;

module.exports = {
  archiveBaseUrl,
  forecastBaseUrl,
  geocodingBaseUrl,
  requestTimeoutMs,
};
