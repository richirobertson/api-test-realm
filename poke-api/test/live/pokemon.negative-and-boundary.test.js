const { baseUrl } = require('../support/config');

// Error payload text is intentionally treated as opaque: consumers should rely on status and media type.
async function expectTextError(url, expectedStatus) {
  const response = await fetch(url);

  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('content-type')).toMatch(/^text\/(?:plain|html)(?:;|$)/i);

  const body = await response.text();
  expect(body.trim().length).toBeGreaterThan(0);
}

// Successful collection pages should always retain their standard JSON envelope.
async function fetchCollectionPage(url) {
  const response = await fetch(url);

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

  const body = await response.json();
  expect(body).toEqual(expect.objectContaining({
    count: expect.any(Number),
    results: expect.any(Array)
  }));
  expect(body).toHaveProperty('next');
  expect(body).toHaveProperty('previous');

  return body;
}

describe('PokéAPI negative and boundary behaviour', () => {
  test.each([
    ['an unknown Pokémon name', '/pokemon/not-a-real-pokemon', 404],
    ['an impossible numeric Pokémon ID', '/pokemon/999999999', 404],
    ['a malformed Pokémon resource path', '/pokemon/25/not-valid', 400]
  ])('returns a text error for %s', async (_description, path, expectedStatus) => {
    await expectTextError(`${baseUrl}${path}`, expectedStatus);
  }, 15_000);

  it('returns an empty, navigable page when the offset is far beyond the collection', async () => {
    const body = await fetchCollectionPage(`${baseUrl}/pokemon?limit=10&offset=1000000`);

    expect(body.results).toEqual([]);
    expect(body.next).toBeNull();
    expect(body.previous).toEqual(expect.any(String));
  }, 15_000);

  it('handles a zero limit with a valid default-sized first page', async () => {
    const body = await fetchCollectionPage(`${baseUrl}/pokemon?limit=0&offset=0`);

    // PokéAPI falls back to its documented default page size rather than returning an invalid response.
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.length).toBeLessThanOrEqual(20);
    expect(body.previous).toBeNull();
    expect(body.next).toEqual(expect.any(String));
  }, 15_000);
});
