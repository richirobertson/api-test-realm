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
  poke pikachu
  poke mr mime
  poke mr mime galar
  poke pikachu galar
  poke dragonite dragon rage
  poke electric kanto
  poke flamethrower johto`;

function identifier(terms) {
  return terms.join("-").trim().toLowerCase().replace(/\s+/g, "-");
}

function invalidCombination(terms) {
  return `Could not understand "poke ${terms.join(" ")}".
Pokémon names and moves may contain multiple words, but the Pokémon must come first when combining it with a move or region.

Valid examples:
  poke pikachu
  poke mr mime
  poke mr mime galar
  poke charizard flamethrower
  poke dragonite dragon rage
  poke pikachu kanto
  poke electric kanto`;
}

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
    const fullName = identifier(terms);
    const fullPokemonResponse =
      terms.length > 1 ? await apiClient.getPokemon(fullName) : null;
    if (terms.length === 1 || fullPokemonResponse.ok) {
      const profile = await buildPokemonProfile(apiClient, fullName);
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

    for (let split = terms.length - 1; split > 0; split -= 1) {
      const pokemonName = identifier(terms.slice(0, split));
      const qualifier = identifier(terms.slice(split));
      const pokemonResponse = await apiClient.getPokemon(pokemonName);
      if (pokemonResponse.ok) {
        const regionResponse = await apiClient.getRegion(qualifier);
        if (regionResponse.ok) {
          const profile = await buildPokemonRegionProfile(
            apiClient,
            pokemonName,
            qualifier,
          );
          if (canRenderImages && profile.imageUrl)
            stdout(await renderThumbnail(profile.imageUrl));
          stdout(formatRegionProfile(profile));
          return 0;
        }
        const moveResponse = await apiClient.getMove(qualifier);
        if (moveResponse.ok) {
          const profile = await buildPokemonMoveProfile(
            apiClient,
            pokemonName,
            qualifier,
          );
          if (canRenderImages && profile.imageUrl)
            stdout(await renderThumbnail(profile.imageUrl));
          stdout(formatMoveProfile(profile));
          return 0;
        }
        throw new Error(invalidCombination(terms));
      }
    }

    // The final term is the region; preceding words form a hyphenated PokéAPI type or move name.
    const region = identifier(terms.slice(-1));
    const criterion = identifier(terms.slice(0, -1));
    const regionResponse = await apiClient.getRegion(region);
    if (!regionResponse.ok) throw new Error(invalidCombination(terms));
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
