function responseError(response, message) {
  if (!response.ok) throw new Error(`${message} (HTTP ${response.status}).`);
  return response.json();
}

const weatherConditions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function weatherDescription(code) {
  return weatherConditions[code] || `Weather code ${code}`;
}

function buildDailyForecast(daily) {
  const fields = [
    daily.time,
    daily.weather_code,
    daily.temperature_2m_max,
    daily.temperature_2m_min,
    daily.precipitation_sum,
  ];
  const isAligned = fields.every(
    (field) => Array.isArray(field) && field.length === daily.time.length,
  );
  if (!isAligned)
    throw new Error("Open-Meteo returned an incomplete daily forecast.");

  return daily.time.map((date, index) => ({
    date,
    conditions: weatherDescription(daily.weather_code[index]),
    weatherCode: daily.weather_code[index],
    highTemperature: daily.temperature_2m_max[index],
    lowTemperature: daily.temperature_2m_min[index],
    precipitation: daily.precipitation_sum[index],
  }));
}

async function getWeatherByPlace(client, place) {
  if (typeof place !== "string" || !place.trim())
    throw new Error("Enter a place name, for example: weather London.");

  const requestedPlace = place.trim();
  const geocoding = await responseError(
    await client.searchPlaces(requestedPlace),
    `Could not look up "${requestedPlace}"`,
  );
  const location = geocoding.results?.[0];
  if (!location) throw new Error(`No location found for "${requestedPlace}".`);

  const forecast = await responseError(
    await client.getForecast({
      latitude: location.latitude,
      longitude: location.longitude,
    }),
    `Could not retrieve the weather forecast for "${location.name}"`,
  );

  return {
    location: {
      name: location.name,
      country: location.country,
      administrativeArea: location.admin1,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      timezone: forecast.timezone,
      elevationMetres: location.elevation,
      population: location.population,
    },
    units: {
      temperature:
        forecast.current_units?.temperature_2m ||
        forecast.daily_units?.temperature_2m_max,
      windSpeed: forecast.current_units?.wind_speed_10m,
      precipitation: forecast.daily_units?.precipitation_sum,
    },
    current: {
      observedAt: forecast.current?.time,
      conditions: weatherDescription(forecast.current?.weather_code),
      temperature: forecast.current?.temperature_2m,
      apparentTemperature: forecast.current?.apparent_temperature,
      weatherCode: forecast.current?.weather_code,
      windSpeed: forecast.current?.wind_speed_10m,
    },
    dailyForecast: buildDailyForecast(forecast.daily || {}),
  };
}

module.exports = {
  buildDailyForecast,
  getWeatherByPlace,
  weatherDescription,
};
