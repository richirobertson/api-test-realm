const pc = require("picocolors");
const highlightedValueMarker = "\uE000";
const pokemonNameMarker = "\uE001";

// Mark only the values that have domain meaning in the CLI output before serializing them.
function markHighlightedValues(value, key) {
  if (Array.isArray(value)) {
    return value.map((item) => markHighlightedValues(item, key));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        markHighlightedValues(childValue, childKey),
      ]),
    );
  }

  if (
    typeof value === "string" &&
    (key === "region" || key === "versionGroups" || key === "versions")
  ) {
    return `${highlightedValueMarker}${value}${highlightedValueMarker}`;
  }

  if (typeof value === "string" && key === "name") {
    return `${pokemonNameMarker}${value}${pokemonNameMarker}`;
  }

  return value;
}

// Generate distinguishable true-colour ANSI values; the golden-angle step keeps adjacent values visually separate.
function distinctValueColor(text, index, colorsEnabled) {
  if (!colorsEnabled) return text;

  const hue = (index * 137.508 + 210) % 360;
  const chroma = 0.65 * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = 0.28;
  const [red, green, blue] = [
    [chroma, 0, 0],
    [0, chroma, 0],
    [0, 0, chroma],
    [chroma, chroma, 0],
    [0, chroma, chroma],
    [chroma, 0, chroma],
  ][Math.floor(hue / 60)];
  const toChannel = (channel) => Math.round((channel + base) * 255);

  return `\u001B[38;2;${toChannel(red)};${toChannel(green)};${toChannel(blue)}m${text}\u001B[39m`;
}

// Keep Pokémon names visibly separate from generic strings and the contextual value palette.
function pokemonNameColor(text, colorsEnabled) {
  if (!colorsEnabled) return text;
  return `\u001B[1;38;2;255;145;0m${text}\u001B[39m`;
}

// Apply lightweight JSON syntax highlighting without changing the underlying JSON representation.
function colorizeJson(json, colorsEnabled = pc.isColorSupported) {
  const highlightedValues = new Map();

  return json.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, stringValue, keySuffix, literal) => {
      if (stringValue?.includes(pokemonNameMarker)) {
        return pokemonNameColor(
          match.replaceAll(pokemonNameMarker, ""),
          colorsEnabled,
        );
      }
      if (stringValue?.includes(highlightedValueMarker)) {
        const cleanValue = match.replaceAll(highlightedValueMarker, "");
        const value = JSON.parse(cleanValue);
        if (!highlightedValues.has(value))
          highlightedValues.set(value, highlightedValues.size);
        return distinctValueColor(
          cleanValue,
          highlightedValues.get(value),
          colorsEnabled,
        );
      }
      if (!colorsEnabled) return match;
      if (stringValue) return keySuffix ? pc.cyan(match) : pc.green(match);
      if (literal === "true" || literal === "false") return pc.magenta(match);
      if (literal === "null") return pc.dim(match);
      return pc.yellow(match);
    },
  );
}

// All CLI output uses readable, indented JSON so it remains useful to people and tools alike.
function formatJson(value, colorsEnabled = pc.isColorSupported) {
  return colorizeJson(
    JSON.stringify(markHighlightedValues(value), null, 2),
    colorsEnabled,
  );
}

module.exports = { colorizeJson, formatJson, markHighlightedValues };
