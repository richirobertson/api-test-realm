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
    return { kind: 'type', name: type.name, candidates: type.pokemon.map(({ pokemon }) => pokemon) };
  }

  const moveResponse = await client.getMove(criterion);
  if (moveResponse.ok) {
    const move = await moveResponse.json();
    return { kind: 'move', name: move.name, candidates: move.learned_by_pokemon };
  }

  throw new Error(`"${criterion}" is not a recognised Pokémon type or move.`);
}

// Intersect a type/move resource list with the regional Pokédex, then sort by Pokédex number.
async function findPokemonByCriterionAndRegion(client, criterion, region) {
  const [criterionData, regionalEntries] = await Promise.all([
    getCriterionCandidates(client, criterion),
    getRegionalEntries(client, region)
  ]);

  const candidates = [...new Map(criterionData.candidates.map((candidate) => [candidate.name, candidate])).values()];
  const baseResults = candidates
    .filter(({ name }) => regionalEntries.has(name))
    .map(({ name, url }) => ({ name, url, entryNumber: regionalEntries.get(name) }))
    .sort((left, right) => left.entryNumber - right.entryNumber || left.name.localeCompare(right.name));

  const results = criterionData.kind === 'move'
    ? await Promise.all(baseResults.map((result) => addMoveLearning(client, result, criterionData.name)))
    : await Promise.all(baseResults.map((result) => addRegionalEncounters(client, result, region)));

  // Keep the terminal response focused on the regional matches rather than the full pre-filter source list.
  const { candidates: ignoredCandidates, ...criterionSummary } = criterionData;
  return { ...criterionSummary, region, results };
}

async function addMoveLearning(client, result, moveName) {
  const pokemon = await readJson(await client.getByUrl(result.url), `Pokémon "${result.name}"`);
  const move = pokemon.moves.find(({ move: candidate }) => candidate.name === moveName);
  const grouped = new Map();
  for (const detail of move?.version_group_details || []) {
    const key = `${detail.move_learn_method.name}:${detail.level_learned_at}`;
    if (!grouped.has(key)) grouped.set(key, { method: detail.move_learn_method.name, level: detail.level_learned_at, versionGroups: [] });
    grouped.get(key).versionGroups.push(detail.version_group.name);
  }
  const learning = [...grouped.values()].map(({ method, level, versionGroups }) => {
    const uniqueGroups = [...new Set(versionGroups)].sort();
    const additionalVersionGroups = Math.max(uniqueGroups.length - 8, 0);
    return { method, ...(level ? { level } : {}), versionGroups: uniqueGroups.slice(0, 8), ...(additionalVersionGroups ? { additionalVersionGroups } : {}) };
  });
  return { name: result.name, imageUrl: pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || null, entryNumber: result.entryNumber, learning };
}

async function addRegionalEncounters(client, result, region) {
  const pokemon = await readJson(await client.getByUrl(result.url), `Pokémon "${result.name}"`);
  const encounters = await readJson(await client.getByUrl(pokemon.location_area_encounters), 'Encounter locations');
  const areas = encounters
    .filter(({ location_area }) => location_area.name.startsWith(`${region}-`))
    .slice(0, 5)
    .map(({ location_area, version_details }) => ({
      area: location_area.name,
      methods: [...new Set(version_details.flatMap(({ encounter_details }) => encounter_details.map(({ method }) => method.name)))],
      versions: [...new Set(version_details.map(({ version }) => version.name))]
    }));
  return { name: result.name, imageUrl: pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || null, entryNumber: result.entryNumber, encounters: areas };
}

module.exports = { findPokemonByCriterionAndRegion, readJson };
