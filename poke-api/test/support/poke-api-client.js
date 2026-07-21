// A small client wrapper centralises URL construction, request timeouts, and retry behaviour.
function createPokeApiClient({ baseUrl, fetchImplementation = fetch, timeoutMs = 10_000, retries = 1 }) {
  const normalisedBaseUrl = `${baseUrl.replace(/\/$/, '')}/`;

  async function get(path) {
    const url = new URL(path, normalisedBaseUrl).toString();
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // HTTP error responses are returned to callers; only transport failures are retried.
        return await fetchImplementation(url, { signal: controller.signal });
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw lastError;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  return {
    getPokemon: (nameOrId) => get(`pokemon/${nameOrId}`)
  };
}

module.exports = { createPokeApiClient };
