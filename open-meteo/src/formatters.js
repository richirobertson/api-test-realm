const pc = require("picocolors");

function paint(enabled, color, value) {
  return enabled ? color(String(value)) : String(value);
}

function present(value, suffix = "") {
  return value === undefined || value === null || value === ""
    ? "—"
    : `${value}${suffix}`;
}

function formatWeather(weather, colorsEnabled = pc.isColorSupported) {
  const {
    location = {},
    units = {},
    current = {},
    dailyForecast = [],
  } = weather;
  const temperatureUnit = units.temperature || "°C";
  const windUnit = units.windSpeed || "km/h";
  const precipitationUnit = units.precipitation || "mm";
  const place = [location.name, location.administrativeArea, location.country]
    .filter(Boolean)
    .join(", ");
  const title = paint(colorsEnabled, pc.bold, `☀  ${place || "Weather"}`);
  const rule = paint(colorsEnabled, pc.dim, "─".repeat(58));
  const condition = paint(
    colorsEnabled,
    pc.bold,
    current.conditions && !current.conditions.includes("undefined")
      ? current.conditions
      : "Conditions unavailable",
  );
  const temperature = paint(
    colorsEnabled,
    pc.cyan,
    present(current.temperature, temperatureUnit),
  );

  const lines = [
    "",
    title,
    rule,
    `  ${condition}   ${temperature}`,
    `  Feels like ${present(current.apparentTemperature, temperatureUnit)}  •  Wind ${present(current.windSpeed, ` ${windUnit}`)}`,
    `  Observed ${present(current.observedAt)}  •  ${present(location.timezone)}`,
    "",
    paint(colorsEnabled, pc.bold, "  3-day forecast"),
  ];

  if (!dailyForecast.length) {
    lines.push(paint(colorsEnabled, pc.dim, "  Forecast unavailable"));
  } else {
    for (const day of dailyForecast) {
      lines.push(
        `  ${present(day.date).padEnd(12)} ${present(day.conditions).padEnd(25)} ${paint(
          colorsEnabled,
          pc.red,
          present(day.highTemperature, temperatureUnit),
        ).padEnd(colorsEnabled ? 18 : 8)} ${paint(
          colorsEnabled,
          pc.blue,
          present(day.lowTemperature, temperatureUnit),
        ).padEnd(colorsEnabled ? 18 : 8)} ${present(
          day.precipitation,
          ` ${precipitationUnit}`,
        )}`,
      );
    }
  }

  if (location.coordinates) {
    lines.push(
      "",
      paint(
        colorsEnabled,
        pc.dim,
        `  ${present(location.coordinates.latitude)}, ${present(
          location.coordinates.longitude,
        )}${location.elevationMetres != null ? `  •  ${location.elevationMetres} m elevation` : ""}`,
      ),
    );
  }
  lines.push(rule, "");
  return lines.join("\n");
}

function formatError(message, colorsEnabled = pc.isColorSupported) {
  return `${paint(colorsEnabled, pc.red, "✖")} ${paint(
    colorsEnabled,
    pc.bold,
    "Weather unavailable",
  )}\n  ${message}`;
}

module.exports = { formatError, formatWeather };
