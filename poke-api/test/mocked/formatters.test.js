const {
  colorizeJson,
  formatJson,
  markHighlightedValues,
} = require("../../src/formatters");

describe("JSON formatter", () => {
  it("marks name, region, and version-group values for semantic highlighting", () => {
    expect(
      markHighlightedValues({
        region: "kanto",
        name: "pikachu",
        versionGroups: ["red-blue", "gold-silver"],
      }),
    ).toEqual({
      region: "\uE000kanto\uE000",
      name: "\uE001pikachu\uE001",
      versionGroups: ["\uE000red-blue\uE000", "\uE000gold-silver\uE000"],
    });
  });

  it("keeps Pokémon names distinct from region and version-group colours", () => {
    const json = JSON.stringify(
      markHighlightedValues({
        name: "pikachu",
        region: "kanto",
        versionGroups: ["red-blue", "gold-silver"],
      }),
      null,
      2,
    );
    const output = colorizeJson(json, true);
    const colours = output
      .split("\u001B[38;2;")
      .slice(1)
      .map((segment) => segment.split("m")[0]);

    expect(colours).toHaveLength(3);
    expect(new Set(colours).size).toBe(3);
    expect(output).toContain('\u001B[1;38;2;255;145;0m"pikachu"');
    expect(output).not.toContain("\uE000");
    expect(output).not.toContain("\uE001");
  });

  it("keeps non-interactive output valid JSON when colours are unavailable", () => {
    expect(JSON.parse(formatJson({ region: "kanto" }))).toEqual({
      region: "kanto",
    });
  });
});
