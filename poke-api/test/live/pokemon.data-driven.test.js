// Ajv applies the same constrained consumer contract to every representative Pokémon.
const Ajv = require('ajv');
const pokemonSchema = require('./pokemon.schema');

const baseUrl = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const validatePokemon = new Ajv({ allErrors: true, strict: false }).compile(pokemonSchema);

// This deliberately varied sample represents common API-consumer scenarios without testing every resource.
const pokemonCases = [
  { description: 'an iconic standard Pokémon', name: 'pikachu', id: 25 },
  { description: 'a dual-type starter Pokémon', name: 'bulbasaur', id: 1 },
  { description: 'a branching-evolution Pokémon', name: 'eevee', id: 133 },
  { description: 'a legendary Pokémon', name: 'mewtwo', id: 150 },
  { description: 'a Pokémon with forms', name: 'deoxys-normal', id: 386 }
];

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
