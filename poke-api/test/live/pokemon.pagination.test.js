// Reuse the pagination behaviour suite for the named Pokémon collection endpoint.
const { registerNamedResourcePaginationSuite } = require('./support/named-resource-pagination-suite');

// An alternate compatible environment can be selected without changing the test code.
const baseUrl = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';

registerNamedResourcePaginationSuite({
  baseUrl,
  resourcePath: 'pokemon',
  limit: 10,
  offset: 20
});
