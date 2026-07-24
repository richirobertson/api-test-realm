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
            flavor_text_entries: [
              {
                flavor_text: "It has a very old description.",
                language: { name: "en" },
                version: {
                  name: "sword",
                  url: "https://pokeapi.co/api/v2/version/29/",
                },
              },
              {
                flavor_text:
                  "When its electricity builds, its muscles are stimulated.",
                language: { name: "en" },
                version: {
                  name: "scarlet",
                  url: "https://pokeapi.co/api/v2/version/40/",
                },
              },
              {
                flavor_text: "It can discharge electricity from its cheeks.",
                language: { name: "en" },
                version: {
                  name: "violet",
                  url: "https://pokeapi.co/api/v2/version/41/",
                },
              },
            ],
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
      if (url === "https://pokeapi.co/api/v2/version/41/")
        return Promise.resolve(
          response({ version_group: { url: "scarlet-violet-group" } }),
        );
      if (url === "scarlet-violet-group")
        return Promise.resolve(
          response({
            versions: [{ name: "scarlet" }, { name: "violet" }],
          }),
        );
      return Promise.resolve(response({ region: { name: "kanto" } }));
    }),
  };
  const profile = await buildPokemonProfile(client, "pikachu");
  expect(profile.pokemon).toEqual(
    expect.objectContaining({ name: "pikachu", heightMetres: 0.4 }),
  );
  expect(Object.keys(profile)[0]).toBe("pokedexDescription");
  expect(profile.pokedexDescription).toEqual([
    {
      game: "scarlet",
      wording: "When its electricity builds, its muscles are stimulated.",
    },
    {
      game: "violet",
      wording: "It can discharge electricity from its cheeks.",
    },
  ]);
  expect(profile.regionalCoverage).toEqual([
    { region: "kanto", pokedexes: [{ name: "kanto", entryNumber: 25 }] },
  ]);
  expect(profile.evolutionLine.evolvesTo[0].species).toBe("pikachu");
  expect(profile.levelUpMoves.shown).toHaveLength(2);
});
