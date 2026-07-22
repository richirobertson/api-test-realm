const { buildPokemonProfile } = require("../../src/pokemon-profile-service");

function response(body) {
  return new Response(JSON.stringify(body), { status: 200 });
}

test("builds a concise profile with evolution, regional Pokédexes, and version-aware level-up moves", async () => {
  const client = {
    getPokemon: jest.fn().mockResolvedValue(
      response({
        id: 25,
        name: "pikachu",
        height: 4,
        weight: 60,
        types: [{ type: { name: "electric" } }],
        abilities: [{ ability: { name: "static" }, is_hidden: false }],
        species: { url: "species" },
        moves: [
          {
            move: { name: "thunder-shock" },
            version_group_details: [
              {
                move_learn_method: { name: "level-up" },
                level_learned_at: 0,
                version_group: { name: "red-blue" },
              },
              {
                move_learn_method: { name: "level-up" },
                level_learned_at: 1,
                version_group: { name: "gold-silver" },
              },
            ],
          },
        ],
      }),
    ),
    getByUrl: jest.fn((url) => {
      if (url === "species")
        return Promise.resolve(
          response({
            is_legendary: false,
            is_mythical: false,
            evolution_chain: { url: "chain" },
            pokedex_numbers: [
              { entry_number: 25, pokedex: { name: "kanto", url: "dex" } },
            ],
          }),
        );
      if (url === "chain")
        return Promise.resolve(
          response({
            chain: {
              species: { name: "pichu" },
              evolves_to: [
                {
                  species: { name: "pikachu" },
                  evolution_details: [
                    { trigger: { name: "level-up" }, min_level: null },
                  ],
                  evolves_to: [],
                },
              ],
            },
          }),
        );
      return Promise.resolve(response({ region: { name: "kanto" } }));
    }),
  };
  const profile = await buildPokemonProfile(client, "pikachu");
  expect(profile.pokemon).toEqual(
    expect.objectContaining({ name: "pikachu", heightMetres: 0.4 }),
  );
  expect(profile.regionalCoverage).toEqual([
    { region: "kanto", pokedexes: [{ name: "kanto", entryNumber: 25 }] },
  ]);
  expect(profile.evolutionLine.evolvesTo[0].species).toBe("pikachu");
  expect(profile.levelUpMoves.shown).toHaveLength(2);
});
