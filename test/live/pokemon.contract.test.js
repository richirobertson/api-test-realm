const Ajv = require('ajv');
const pokemonSchema = require('./pokemon.schema');

const baseUrl = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const validatePokemon = new Ajv({ allErrors: true, strict: false }).compile(pokemonSchema);

describe('PokéAPI: GET /pokemon/pikachu', () => {
  it('returns a successful JSON response matching the constrained Pokémon contract', async () => {
    const response = await fetch(`${baseUrl}/pokemon/pikachu`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

    const body = await response.json();
    const isValid = validatePokemon(body);

    expect(isValid).toBe(true);
    if (!isValid) {
      throw new Error(`Pokémon contract failed: ${JSON.stringify(validatePokemon.errors)}`);
    }
  }, 15_000);
});
