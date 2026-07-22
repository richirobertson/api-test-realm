#!/usr/bin/env node
const {
  forecastBaseUrl,
  geocodingBaseUrl,
  requestTimeoutMs,
} = require("./config");
const { createOpenMeteoClient } = require("./open-meteo-client");
const { getWeatherByPlace } = require("./weather-service");

const usage = `Usage:
  weather <place>

Examples:
  weather London
  weather "New York"`;

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

async function run(
  argumentsList,
  { client, stdout = console.log, stderr = console.error } = {},
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
    stdout(
      formatJson(await getWeatherByPlace(apiClient, argumentsList.join(" "))),
    );
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
