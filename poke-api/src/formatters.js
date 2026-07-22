const pc = require("picocolors");

// Apply lightweight JSON syntax highlighting without changing the underlying JSON representation.
function colorizeJson(json) {
  return json.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, stringValue, keySuffix, literal) => {
      if (stringValue) return keySuffix ? pc.cyan(match) : pc.green(match);
      if (literal === "true" || literal === "false") return pc.magenta(match);
      if (literal === "null") return pc.dim(match);
      return pc.yellow(match);
    },
  );
}

// All CLI output uses readable, indented JSON so it remains useful to people and tools alike.
function formatJson(value) {
  return colorizeJson(JSON.stringify(value, null, 2));
}

module.exports = { formatJson };
