const {
  formatError,
  formatMoveProfile,
  formatPokemonProfile,
  formatSearchResult,
  formatSearchSummary,
} = require("../../src/formatters");

describe("Pokémon terminal formatter", () => {
  it("renders a structured profile with readable domain sections", () => {
    const output = formatPokemonProfile(
      {
        pokemon: {
          id: 25,
          name: "pikachu",
          types: ["electric"],
          heightMetres: 0.4,
          weightKilograms: 6,
          abilities: [{ name: "static", hidden: false }],
        },
        pokedexDescription: [{ game: "yellow", wording: "A famous mouse." }],
        regionalCoverage: [
          {
            region: "kanto",
            pokedexes: [{ name: "kanto", entryNumber: 25 }],
          },
        ],
        evolutionLine: { species: "pichu", evolvesTo: [] },
        levelUpMoves: {
          total: 1,
          shown: [
            { move: "thunder-shock", level: 1, versionGroups: ["red-blue"] },
          ],
        },
      },
      false,
    );

    expect(output).toContain("#0025  PIKACHU");
    expect(output).toContain("Type           electric");
    expect(output).toContain("REGIONAL POKÉDEX");
    expect(output).toContain("EVOLUTION");
    expect(output).toContain("LEVEL-UP MOVES (1)");
    expect(output).not.toContain('"pokemon"');
  });

  it("renders move and search details without exposing JSON", () => {
    expect(
      formatMoveProfile(
        {
          pokemon: "charizard",
          move: "flamethrower",
          learning: [
            { method: "level-up", level: 46, versionGroup: "red-blue" },
          ],
        },
        false,
      ),
    ).toContain("level up at level 46");
    expect(
      formatSearchSummary(
        { region: "kanto", name: "electric", kind: "type", resultCount: 3 },
        false,
      ),
    ).toContain("3 Pokémon match this type.");
    expect(
      formatSearchResult(
        {
          name: "pikachu",
          entryNumber: 25,
          encounters: [
            { area: "kanto-forest", methods: ["walk"], versions: ["yellow"] },
          ],
        },
        false,
      ),
    ).toContain("#025  PIKACHU");
  });

  it("renders a concise labelled error", () => {
    expect(formatError("Not found.", false)).toBe(
      "✖ Pokémon lookup failed\n  Not found.",
    );
  });
});
