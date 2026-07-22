#!/usr/bin/env node
const {
  forecastBaseUrl,
  geocodingBaseUrl,
  requestTimeoutMs,
} = require("./config");
const { createOpenMeteoClient } = require("./open-meteo-client");
const { formatJson } = require("./formatters");
const { getWeatherByPlace } = require("./weather-service");
const {
  isChafaAvailable,
  renderWeatherSymbol,
} = require("./weather-image-renderer");

const usage = `Usage:
  weather <place>

Examples:
  weather London
  weather "New York"

The result includes local time, readable conditions, units, and a three-day forecast.`;

async function run(
  argumentsList,
  {
    client,
    stdout = console.log,
    stderr = console.error,
    canRenderWeatherSymbol = isChafaAvailable,
    renderSymbol = renderWeatherSymbol,
  } = {},
) {
  if (!argumentsList.length || ["help", "--help"].includes(argumentsList[0])) {
    stdout(usage);
    return 0;
  }

  try {
    const apiClient =
      client ||
      createOpenMeteoClient({
        geocodingBaseUrl,
        forecastBaseUrl,
        timeoutMs: requestTimeoutMs,
      });
    const weather = await getWeatherByPlace(apiClient, argumentsList.join(" "));
    if (canRenderWeatherSymbol())
      stdout(renderSymbol(weather.current.weatherCode));
    stdout(formatJson(weather));
    return 0;
  } catch (error) {
    stderr(formatJson({ error: error.message }));
    return 1;
  }
}

if (require.main === module) {
  run(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = { run, usage };
