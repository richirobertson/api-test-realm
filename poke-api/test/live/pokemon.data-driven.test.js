// Ajv applies the same constrained consumer contract to every representative Pokémon.
const Ajv = require('ajv');
const pokemonSchema = require('../schemas/pokemon.schema');
const { baseUrl } = require('../support/config');
const { pokemonCases } = require('../support/pokemon-test-data');

const validatePokemon = new Ajv({ allErrors: true, strict: false }).compile(pokemonSchema);

describe('PokéAPI data-driven Pokémon contracts', () => {
  test.each(pokemonCases)('returns shared invariants for $description: $name', async ({ name, id }) => {
    const response = await fetch(`${baseUrl}/pokemon/${name}`);

    // Verify a successful JSON response before checking resource-specific and shared contracts.
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({
      id,
      name,
      is_default: expect.any(Boolean),
      species: expect.objectContaining({
        name: expect.any(String),
        url: expect.any(String)
      }),
      forms: expect.any(Array)
    }));

    // Reuse the constrained contract from the smoke suite so the coverage stays consistent.
    const isValid = validatePokemon(body);
    expect(isValid).toBe(true);
    if (!isValid) {
      throw new Error(`Pokémon contract failed for ${name}: ${JSON.stringify(validatePokemon.errors)}`);
    }
  }, 15_000);
});
