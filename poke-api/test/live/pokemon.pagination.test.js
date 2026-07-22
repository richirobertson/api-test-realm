// Reuse the pagination behaviour suite for the named Pokémon collection endpoint.
const {
  registerNamedResourcePaginationSuite,
} = require("../support/named-resource-pagination-suite");
const { baseUrl } = require("../support/config");

registerNamedResourcePaginationSuite({
  baseUrl,
  resourcePath: "pokemon",
  limit: 10,
  offset: 20,
});
