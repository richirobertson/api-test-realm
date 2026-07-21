// Load a local .env file when present; environment variables supplied by CI take precedence.
require('dotenv').config();

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Keep environment-specific behaviour in one place so suites do not duplicate configuration logic.
const baseUrl = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const requestTimeoutMs = positiveInteger(process.env.POKEAPI_TIMEOUT_MS, 10_000);
const testTags = (process.env.POKEAPI_TEST_TAGS || 'live')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

module.exports = { baseUrl, requestTimeoutMs, testTags };
