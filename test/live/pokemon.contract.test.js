// Ajv validates JSON payloads against the schema kept alongside this test suite.
const Ajv = require('ajv');
const pokemonSchema = require('./pokemon.schema');

// An environment variable makes the suite reusable against a compatible alternate environment.
const baseUrl = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
// Report every schema discrepancy in one run, making a failed contract easier to diagnose.
const validatePokemon = new Ajv({ allErrors: true, strict: false }).compile(pokemonSchema);

describe('PokéAPI: GET /pokemon/pikachu', () => {
  it('returns a successful JSON response matching the constrained Pokémon contract', async () => {
    // Use the Node.js Fetch API to make a genuine request to the public service.
    const response = await fetch(`${baseUrl}/pokemon/pikachu`);

    // Confirm transport-level behaviour before inspecting the resource payload.
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

    const body = await response.json();
    // Validate stable, consumer-relevant fields rather than snapshotting the whole payload.
    const isValid = validatePokemon(body);

    expect(isValid).toBe(true);
    if (!isValid) {
      // Surface Ajv's detailed errors if the contract assertion fails.
      throw new Error(`Pokémon contract failed: ${JSON.stringify(validatePokemon.errors)}`);
    }
  }, 15_000);

  it('resolves the same canonical resource by numeric ID and name', async () => {
    // Run independent lookups together; their relationship is checked below.
    const [byId, byName] = await Promise.all([
      fetch(`${baseUrl}/pokemon/25`),
      fetch(`${baseUrl}/pokemon/pikachu`)
    ]);

    // Each API route must succeed before its JSON body is used.
    expect(byId.status).toBe(200);
    expect(byName.status).toBe(200);

    // Decode both successful representations in parallel.
    const [pokemonById, pokemonByName] = await Promise.all([
      byId.json(),
      byName.json()
    ]);

    // Assert the expected canonical identity and then its equivalence across lookup methods.
    expect(pokemonById).toEqual(expect.objectContaining({ id: 25, name: 'pikachu' }));
    expect(pokemonByName).toEqual(expect.objectContaining({ id: 25, name: 'pikachu' }));
    expect(pokemonById.id).toBe(pokemonByName.id);
    expect(pokemonById.name).toBe(pokemonByName.name);
  }, 15_000);
});
