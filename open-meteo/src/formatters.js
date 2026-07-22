const pc = require("picocolors");

const contextualMarker = "\uE000";
const locationMarker = "\uE001";

function markWeatherValues(value, key) {
  if (Array.isArray(value))
    return value.map((item) => markWeatherValues(item, key));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        markWeatherValues(childValue, childKey),
      ]),
    );
  if (typeof value === "string" && key === "name")
    return `${locationMarker}${value}${locationMarker}`;
  if (
    typeof value === "string" &&
    ["country", "timezone", "conditions"].includes(key)
  )
    return `${contextualMarker}${value}${contextualMarker}`;
  return value;
}

function contextualColor(text, index, colorsEnabled) {
  if (!colorsEnabled) return text;
  const hue = (index * 137.508 + 210) % 360;
  const red = Math.round(128 + 100 * Math.sin((hue * Math.PI) / 180));
  const green = Math.round(128 + 100 * Math.sin(((hue + 120) * Math.PI) / 180));
  const blue = Math.round(128 + 100 * Math.sin(((hue + 240) * Math.PI) / 180));
  return `\u001B[38;2;${red};${green};${blue}m${text}\u001B[39m`;
}

function colorizeJson(json, colorsEnabled = pc.isColorSupported) {
  const contextualValues = new Map();

  return json.replace(/"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"/g, (match) => {
    if (match.includes(locationMarker)) {
      const cleanValue = match.replaceAll(locationMarker, "");
      return colorsEnabled
        ? `\u001B[1;38;2;255;145;0m${cleanValue}\u001B[39m`
        : cleanValue;
    }
    if (match.includes(contextualMarker)) {
      const cleanValue = match.replaceAll(contextualMarker, "");
      const value = JSON.parse(cleanValue);
      if (!contextualValues.has(value))
        contextualValues.set(value, contextualValues.size);
      return contextualColor(
        cleanValue,
        contextualValues.get(value),
        colorsEnabled,
      );
    }
    return match;
  });
}

function formatJson(value, colorsEnabled = pc.isColorSupported) {
  return colorizeJson(
    JSON.stringify(markWeatherValues(value), null, 2),
    colorsEnabled,
  );
}

module.exports = { colorizeJson, formatJson, markWeatherValues };
