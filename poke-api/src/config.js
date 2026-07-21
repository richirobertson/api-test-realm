// Load local settings without adding dotenv's diagnostic output to the user-facing CLI.
require('dotenv').config({ quiet: true });

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const testTags = (process.env.POKEAPI_TEST_TAGS || 'live')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

module.exports = {
  baseUrl: process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2',
  requestTimeoutMs: positiveInteger(process.env.POKEAPI_TIMEOUT_MS, 10_000),
  testTags
};
