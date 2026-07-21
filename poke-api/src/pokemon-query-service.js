// Convert a successful response into JSON or surface a concise, consumer-friendly failure.
async function readJson(response, description) {
  if (!response.ok) {
    throw new Error(`${description} was not found (HTTP ${response.status}).`);
  }
  return response.json();
}

// Build a regional species lookup from every Pokédex associated with that region.
async function getRegionalEntries(client, region) {
  const regionData = await readJson(await client.getRegion(region), `Region "${region}"`);
  const pokedexes = await Promise.all(
    regionData.pokedexes.map(async ({ url }) => readJson(await client.getByUrl(url), 'Regional Pokédex'))
  );

  return new Map(
    pokedexes
      .flatMap(({ pokemon_entries }) => pokemon_entries)
      .map(({ entry_number, pokemon_species }) => [pokemon_species.name, entry_number])
  );
}

// Resolve the first term as a type first, then as a move, using the resource's own Pokémon list.
async function getCriterionCandidates(client, criterion) {
  const typeResponse = await client.getType(criterion);
  if (typeResponse.ok) {
    const type = await typeResponse.json();
    return { kind: 'type', name: type.name, candidates: type.pokemon.map(({ pokemon }) => pokemon.name) };
  }

  const moveResponse = await client.getMove(criterion);
  if (moveResponse.ok) {
    const move = await moveResponse.json();
    return { kind: 'move', name: move.name, candidates: move.learned_by_pokemon.map(({ name }) => name) };
  }

  throw new Error(`"${criterion}" is not a recognised Pokémon type or move.`);
}

// Intersect a type/move resource list with the regional Pokédex, then sort by Pokédex number.
async function findPokemonByCriterionAndRegion(client, criterion, region) {
  const [criterionData, regionalEntries] = await Promise.all([
    getCriterionCandidates(client, criterion),
    getRegionalEntries(client, region)
  ]);

  const results = [...new Set(criterionData.candidates)]
    .filter((name) => regionalEntries.has(name))
    .map((name) => ({ name, entryNumber: regionalEntries.get(name) }))
    .sort((left, right) => left.entryNumber - right.entryNumber || left.name.localeCompare(right.name));

  // Keep the terminal response focused on the regional matches rather than the full pre-filter source list.
  const { candidates, ...criterionSummary } = criterionData;
  return { ...criterionSummary, region, results };
}

module.exports = { findPokemonByCriterionAndRegion, readJson };
