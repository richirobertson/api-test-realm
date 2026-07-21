const { baseUrl } = require('../support/config');
const apiOrigin = new URL(baseUrl).origin;
const maxResponseTimeMs = 8_000;

// Detect duplicate relationship values without asserting a fixed list length or exact contents.
function expectUnique(values) {
  expect(new Set(values).size).toBe(values.length);
}

// Confirm references are well-formed links to the expected public API environment and resource families.
function expectValidApiReference(reference) {
  expect(reference).toEqual(expect.objectContaining({
    name: expect.any(String),
    url: expect.any(String)
  }));

  const url = new URL(reference.url);
  expect(url.protocol).toBe('https:');
  expect(url.origin).toBe(apiOrigin);
  expect(url.pathname).toMatch(/^\/api\/v2\/(?:type|ability|stat|pokemon-species|pokemon-form)\//);
}

describe('PokéAPI response quality: GET /pokemon/pikachu', () => {
  it('returns a timely JSON response with unique lists and valid API references', async () => {
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/pokemon/pikachu`);
    const elapsedMs = Date.now() - startedAt;

    // The threshold is deliberately lenient for a public API; record the actual timing for visibility.
    console.info(`[response-quality] GET /pokemon/pikachu completed in ${elapsedMs} ms`);
    expect(elapsedMs).toBeLessThan(maxResponseTimeMs);
    // The shared matcher keeps status and JSON media-type expectations consistent across suites.
    expect(response).toBeSuccessfulJsonResponse();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

    const body = await response.json();
    expectUnique(body.types.map(({ type }) => type.name));
    expectUnique(body.abilities.map(({ ability }) => ability.name));
    expectUnique(body.stats.map(({ stat }) => stat.name));
    expectUnique(body.forms.map(({ name }) => name));

    const references = [
      ...body.types.map(({ type }) => type),
      ...body.abilities.map(({ ability }) => ability),
      ...body.stats.map(({ stat }) => stat),
      body.species,
      ...body.forms
    ];
    references.forEach(expectValidApiReference);
  }, 15_000);
});
