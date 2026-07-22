const { baseUrl } = require("../support/config");

// Follow a PokéAPI link and apply the minimum transport checks common to this journey.
async function fetchJson(url) {
  const response = await fetch(url);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(
    /^application\/json(?:;|$)/i,
  );

  return response.json();
}

// Evolution chains branch, so recursively flatten every species name from the tree.
function collectSpeciesNames(chainNode) {
  return [
    chainNode.species.name,
    ...chainNode.evolves_to.flatMap(collectSpeciesNames),
  ];
}

describe("PokéAPI cross-resource integrity: Pokémon to evolution chain", () => {
  it("finds the Pokémon species in the evolution chain reached through published resource links", async () => {
    // Start at the Pokémon resource rather than constructing a species URL ourselves.
    const pokemon = await fetchJson(`${baseUrl}/pokemon/pikachu`);
    expect(pokemon.species).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        url: expect.any(String),
      }),
    );

    // The Pokémon response supplies the authoritative species resource location.
    const species = await fetchJson(pokemon.species.url);
    expect(species.name).toBe(pokemon.species.name);
    expect(species.evolution_chain).toEqual(
      expect.objectContaining({ url: expect.any(String) }),
    );

    // The species response supplies the authoritative evolution-chain location.
    const evolutionChain = await fetchJson(species.evolution_chain.url);
    const chainSpeciesNames = collectSpeciesNames(evolutionChain.chain);

    // Confirm the linked resources describe a coherent domain relationship.
    expect(chainSpeciesNames).toContain(species.name);
  }, 15_000);
});
