// Register a standard set of pagination checks for PokéAPI endpoints that return named resources.
// Keeping these assertions here lets new endpoint suites reuse the same consumer-facing behaviour.
function registerNamedResourcePaginationSuite({ baseUrl, resourcePath, limit, offset }) {
  const collectionUrl = `${baseUrl}/${resourcePath}?limit=${limit}&offset=${offset}`;
  // PokéAPI canonicalises pagination links without a trailing slash on the collection path.
  const expectedPath = `${new URL(baseUrl).pathname.replace(/\/$/, '')}/${resourcePath}`;

  // Request one page and ensure it has the shape shared by named PokéAPI resource lists.
  async function fetchPage(url) {
    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json(?:;|$)/i);

    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({
      count: expect.any(Number),
      results: expect.any(Array)
    }));
    expect(body.results).toHaveLength(limit);

    const names = body.results.map((resource) => resource.name);
    expect(names).toHaveLength(new Set(names).size);
    expect(names).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(body.results.every((resource) => resource.name.length > 0)).toBe(true);

    return { body, names };
  }

  // Verify a pagination link targets this collection and carries the required page controls.
  function expectPageLink(link, expectedOffset) {
    expect(link).toEqual(expect.any(String));

    const url = new URL(link);
    expect(url.pathname).toBe(expectedPath);
    expect(url.searchParams.get('limit')).toBe(String(limit));
    expect(url.searchParams.get('offset')).toBe(String(expectedOffset));

    return url.toString();
  }

  describe(`${resourcePath} pagination`, () => {
    it(`returns ${limit} distinct named resources for offset ${offset}`, async () => {
      await fetchPage(collectionUrl);
    }, 15_000);

    it('publishes correctly parameterised next and previous links', async () => {
      const { body } = await fetchPage(collectionUrl);

      expectPageLink(body.previous, offset - limit);
      expectPageLink(body.next, offset + limit);
    }, 15_000);

    it('allows consumers to navigate to adjacent, non-overlapping pages', async () => {
      const { body: currentPage, names: currentNames } = await fetchPage(collectionUrl);
      const previousUrl = expectPageLink(currentPage.previous, offset - limit);
      const nextUrl = expectPageLink(currentPage.next, offset + limit);

      const [{ names: previousNames }, { names: nextNames }] = await Promise.all([
        fetchPage(previousUrl),
        fetchPage(nextUrl)
      ]);

      // Adjacent pages must not repeat a resource from the current page.
      expect(previousNames.some((name) => currentNames.includes(name))).toBe(false);
      expect(nextNames.some((name) => currentNames.includes(name))).toBe(false);
    }, 15_000);
  });
}

module.exports = { registerNamedResourcePaginationSuite };
