function responseError(response, message) {
  if (!response.ok) throw new Error(`${message} (HTTP ${response.status}).`);
  return response.json();
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
    weatherCode: daily.weather_code[index],
    maximumTemperature: daily.temperature_2m_max[index],
    minimumTemperature: daily.temperature_2m_min[index],
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
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: forecast.timezone,
    },
    current: {
      temperature: forecast.current?.temperature_2m,
      apparentTemperature: forecast.current?.apparent_temperature,
      weatherCode: forecast.current?.weather_code,
      windSpeed: forecast.current?.wind_speed_10m,
    },
    dailyForecast: buildDailyForecast(forecast.daily || {}),
  };
}

module.exports = { buildDailyForecast, getWeatherByPlace };
