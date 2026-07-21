// A shared PokéAPI client keeps URL construction, timeouts, and transient-network retries consistent.
function createPokeApiClient({ baseUrl, fetchImplementation = fetch, timeoutMs = 10_000, retries = 1 }) {
  const normalisedBaseUrl = `${baseUrl.replace(/\/$/, '')}/`;

  async function getUrl(url) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Callers handle HTTP statuses; only transport failures are retried.
        return await fetchImplementation(url, { signal: controller.signal });
      } catch (error) {
        lastError = error;
        if (attempt === retries) throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  function getResource(resource, nameOrId) {
    return getUrl(new URL(`${resource}/${encodeURIComponent(nameOrId)}`, normalisedBaseUrl).toString());
  }

  return {
    getByUrl: getUrl,
    getPokemon: (nameOrId) => getResource('pokemon', nameOrId),
    getType: (nameOrId) => getResource('type', nameOrId),
    getMove: (nameOrId) => getResource('move', nameOrId),
    getRegion: (nameOrId) => getResource('region', nameOrId),
    getPokedex: (nameOrId) => getResource('pokedex', nameOrId)
  };
}

module.exports = { createPokeApiClient };
