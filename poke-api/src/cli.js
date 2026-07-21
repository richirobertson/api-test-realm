#!/usr/bin/env node
const { baseUrl, requestTimeoutMs } = require('./config');
const { createPokeApiClient } = require('./poke-api-client');
const { findPokemonByCriterionAndRegion, readJson } = require('./pokemon-query-service');
const { formatJson } = require('./formatters');

const usage = `Usage:
  npm run poke -- {{pokemon}}
  npm run poke -- {{type-or-move}} {{region}}

Examples:
  npm run poke -- pikachu
  npm run poke -- electric kanto
  npm run poke -- flamethrower johto`;

async function run(argumentsList, { client, stdout = console.log, stderr = console.error } = {}) {
  const terms = argumentsList;
  const apiClient = client || createPokeApiClient({ baseUrl, timeoutMs: requestTimeoutMs });

  if (!terms.length || terms[0] === '--help' || terms[0] === 'help' || terms.length > 2) {
    stdout(usage);
    return 0;
  }

  try {
    if (terms.length === 1) {
      const pokemon = await readJson(await apiClient.getPokemon(terms[0]), `Pokémon "${terms[0]}"`);
      stdout(formatJson(pokemon));
      return 0;
    }

    const result = await findPokemonByCriterionAndRegion(apiClient, terms[0], terms[1]);
    stdout(formatJson(result));
    return 0;
  } catch (error) {
    stderr(formatJson({ error: error.message }));
    return 1;
  }
}

if (require.main === module) {
  run(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = { run, usage };
