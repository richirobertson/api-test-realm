const { findPokemonByCriterionAndRegion } = require('../../src/pokemon-query-service');

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function regionalClient({ typeResponse, moveResponse }) {
  return {
    getType: jest.fn().mockResolvedValue(typeResponse),
    getMove: jest.fn().mockResolvedValue(moveResponse || new Response('', { status: 404 })),
    getRegion: jest.fn().mockResolvedValue(jsonResponse({ pokedexes: [{ url: 'https://example.test/pokedex/kanto' }] })),
    getByUrl: jest.fn().mockResolvedValue(jsonResponse({
      pokemon_entries: [
        { entry_number: 25, pokemon_species: { name: 'pikachu' } },
        { entry_number: 26, pokemon_species: { name: 'raichu' } }
      ]
    }))
  };
}

describe('type/move and regional Pokédex queries', () => {
  it('intersects type Pokémon with regional Pokédex entries and sorts by entry number', async () => {
    const client = regionalClient({
      typeResponse: jsonResponse({ name: 'electric', pokemon: [
        { pokemon: { name: 'raichu' } },
        { pokemon: { name: 'pikachu' } },
        { pokemon: { name: 'magnezone' } }
      ] })
    });

    const result = await findPokemonByCriterionAndRegion(client, 'electric', 'kanto');

    expect(result).toEqual(expect.objectContaining({
      kind: 'type',
      name: 'electric',
      region: 'kanto',
      results: [
        { name: 'pikachu', entryNumber: 25 },
        { name: 'raichu', entryNumber: 26 }
      ]
    }));
  });

  it('falls back to a move when the first term is not a Pokémon type', async () => {
    const client = regionalClient({
      typeResponse: new Response('', { status: 404 }),
      moveResponse: jsonResponse({ name: 'thunderbolt', learned_by_pokemon: [
        { name: 'raichu' },
        { name: 'eevee' }
      ] })
    });

    const result = await findPokemonByCriterionAndRegion(client, 'thunderbolt', 'kanto');

    expect(result.kind).toBe('move');
    expect(result.results).toEqual([{ name: 'raichu', entryNumber: 26 }]);
  });
});
