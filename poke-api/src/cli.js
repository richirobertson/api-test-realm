#!/usr/bin/env node
const { baseUrl, requestTimeoutMs } = require('./config');
const { createPokeApiClient } = require('./poke-api-client');
const { findPokemonByCriterionAndRegion } = require('./pokemon-query-service');
const { buildPokemonProfile } = require('./pokemon-profile-service');
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

  if (!terms.length || terms[0] === '--help' || terms[0] === 'help') {
    stdout(usage);
    return 0;
  }

  try {
    if (terms.length === 1) {
      stdout(formatJson(await buildPokemonProfile(apiClient, terms[0])));
      return 0;
    }

    // The final term is the region; preceding words form a hyphenated PokéAPI type or move name.
    const region = terms.at(-1);
    const criterion = terms.slice(0, -1).join('-');
    const result = await findPokemonByCriterionAndRegion(apiClient, criterion, region);
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
