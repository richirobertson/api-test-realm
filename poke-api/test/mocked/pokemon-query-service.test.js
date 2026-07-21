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
    getByUrl: jest.fn((url) => {
      if (url.includes('pokedex')) return Promise.resolve(jsonResponse({ pokemon_entries: [
        { entry_number: 25, pokemon_species: { name: 'pikachu' } },
        { entry_number: 26, pokemon_species: { name: 'raichu' } }
      ] }));
      if (url === 'encounters') return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse({ location_area_encounters: 'encounters', moves: [{ move: { name: 'thunderbolt' }, version_group_details: [{ move_learn_method: { name: 'machine' }, level_learned_at: 0, version_group: { name: 'red-blue' } }] }] }));
    })
  };
}

describe('type/move and regional Pokédex queries', () => {
  it('intersects type Pokémon with regional Pokédex entries and sorts by entry number', async () => {
    const client = regionalClient({
      typeResponse: jsonResponse({ name: 'electric', pokemon: [
        { pokemon: { name: 'raichu', url: 'raichu' } },
        { pokemon: { name: 'pikachu', url: 'pikachu' } },
        { pokemon: { name: 'magnezone', url: 'magnezone' } }
      ] })
    });

    const result = await findPokemonByCriterionAndRegion(client, 'electric', 'kanto');

    expect(result).toEqual(expect.objectContaining({
      kind: 'type',
      name: 'electric',
      region: 'kanto',
      results: [
        { name: 'pikachu', imageUrl: null, entryNumber: 25, encounters: [] },
        { name: 'raichu', imageUrl: null, entryNumber: 26, encounters: [] }
      ]
    }));
  });

  it('falls back to a move when the first term is not a Pokémon type', async () => {
    const client = regionalClient({
      typeResponse: new Response('', { status: 404 }),
      moveResponse: jsonResponse({ name: 'thunderbolt', learned_by_pokemon: [
        { name: 'raichu', url: 'raichu' },
        { name: 'eevee', url: 'eevee' }
      ] })
    });

    const result = await findPokemonByCriterionAndRegion(client, 'thunderbolt', 'kanto');

    expect(result.kind).toBe('move');
    expect(result.results).toEqual([{ name: 'raichu', imageUrl: null, entryNumber: 26, learning: [{ method: 'machine', versionGroups: ['red-blue'] }] }]);
  });
});
