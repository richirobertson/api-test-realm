#!/usr/bin/env node
const readline = require("node:readline/promises");
const { baseUrl, requestTimeoutMs } = require("./config");
const { createPokeApiClient } = require("./poke-api-client");
const { findPokemonByCriterionAndRegion } = require("./pokemon-query-service");
const {
  buildPokemonProfile,
  buildPokemonRegionProfile,
  buildPokemonMoveProfile,
} = require("./pokemon-profile-service");
const {
  formatAlternateArtworkNote,
  formatError,
  formatMoreResults,
  formatMoveProfile,
  formatPokemonProfile,
  formatRegionProfile,
  formatSearchResult,
  formatSearchSummary,
  formatShinyArtworkNote,
} = require("./formatters");
const { renderThumbnail, isChafaAvailable } = require("./image-renderer");

const usage = `Usage:
  npm run poke -- {{pokemon}}
  npm run poke -- {{pokemon}} {{region-or-move}}
  npm run poke -- {{type-or-move}} {{region}}

Examples:
  npm run poke -- pikachu
  npm run poke -- pikachu galar
  npm run poke -- charizard flamethrower
  npm run poke -- electric kanto
  npm run poke -- flamethrower johto`;

async function loadNextPage() {
  if (!process.stdin.isTTY) return false;
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await prompt.question("Load the next 10 results? [y/N] ");
  prompt.close();
  return /^y(?:es)?$/i.test(answer.trim());
}

async function run(
  argumentsList,
  { client, stdout = console.log, stderr = console.error } = {},
) {
  const canRenderImages = isChafaAvailable();
  const terms = argumentsList;
  const apiClient =
    client || createPokeApiClient({ baseUrl, timeoutMs: requestTimeoutMs });

  if (!terms.length || terms[0] === "--help" || terms[0] === "help") {
    stdout(usage);
    return 0;
  }

  try {
    if (terms.length === 1) {
      const profile = await buildPokemonProfile(apiClient, terms[0]);
      const thumbnail =
        canRenderImages && profile.pokemon.imageUrl
          ? await renderThumbnail(profile.pokemon.imageUrl)
          : null;
      const shinyThumbnail =
        canRenderImages && profile.pokemon.shinyImageUrl
          ? await renderThumbnail(profile.pokemon.shinyImageUrl)
          : thumbnail;
      const alternateThumbnail =
        canRenderImages &&
        profile.pokemon.alternateImageUrl &&
        profile.pokemon.alternateImageUrl !== profile.pokemon.imageUrl
          ? await renderThumbnail(profile.pokemon.alternateImageUrl)
          : null;
      if (thumbnail) stdout(thumbnail);
      stdout(formatPokemonProfile(profile));
      if (alternateThumbnail) {
        stdout(formatAlternateArtworkNote(profile.pokemon));
        stdout(alternateThumbnail);
      }
      if (shinyThumbnail) {
        stdout(formatShinyArtworkNote(profile.pokemon));
        stdout(shinyThumbnail);
      }
      return 0;
    }

    if (terms.length === 2) {
      const pokemonResponse = await apiClient.getPokemon(terms[0]);
      if (pokemonResponse.ok) {
        const regionResponse = await apiClient.getRegion(terms[1]);
        if (regionResponse.ok) {
          const profile = await buildPokemonRegionProfile(
            apiClient,
            terms[0],
            terms[1],
          );
          if (canRenderImages && profile.imageUrl)
            stdout(await renderThumbnail(profile.imageUrl));
          stdout(formatRegionProfile(profile));
          return 0;
        }
        const moveResponse = await apiClient.getMove(terms[1]);
        if (moveResponse.ok) {
          const profile = await buildPokemonMoveProfile(
            apiClient,
            terms[0],
            terms[1],
          );
          if (canRenderImages && profile.imageUrl)
            stdout(await renderThumbnail(profile.imageUrl));
          stdout(formatMoveProfile(profile));
          return 0;
        }
      }
    }

    // The final term is the region; preceding words form a hyphenated PokéAPI type or move name.
    const region = terms.at(-1);
    const criterion = terms.slice(0, -1).join("-");
    const result = await findPokemonByCriterionAndRegion(
      apiClient,
      criterion,
      region,
    );
    stdout(
      formatSearchSummary({
        kind: result.kind,
        name: result.name,
        region: result.region,
        resultCount: result.results.length,
      }),
    );
    for (let offset = 0; offset < result.results.length; offset += 10) {
      const page = result.results.slice(offset, offset + 10);
      for (const pokemon of page) {
        if (canRenderImages && pokemon.imageUrl)
          stdout(await renderThumbnail(pokemon.imageUrl));
        stdout(formatSearchResult(pokemon));
      }
      if (offset + 10 < result.results.length && !(await loadNextPage())) {
        stdout(formatMoreResults(result.results.length - offset - 10));
        break;
      }
    }
    return 0;
  } catch (error) {
    stderr(formatError(error.message));
    return 1;
  }
}

if (require.main === module) {
  run(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = { run, usage };
