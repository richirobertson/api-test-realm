const { readJson } = require('./pokemon-query-service');

function evolutionCondition(detail) {
  return Object.fromEntries(Object.entries({
    trigger: detail.trigger?.name,
    minLevel: detail.min_level || undefined,
    item: detail.item?.name,
    heldItem: detail.held_item?.name,
    timeOfDay: detail.time_of_day || undefined,
    minHappiness: detail.min_happiness || undefined
  }).filter(([, value]) => value !== undefined && value !== null));
}

function summariseEvolution(node) {
  return {
    species: node.species.name,
    evolvesTo: node.evolves_to.map((child) => ({
      conditions: child.evolution_details.map(evolutionCondition),
      ...summariseEvolution(child)
    }))
  };
}

function levelUpMoves(moves, maximum = 20) {
  const grouped = new Map();
  for (const { move, version_group_details: details } of moves) {
    for (const detail of details.filter(({ move_learn_method }) => move_learn_method.name === 'level-up')) {
      const key = `${move.name}:${detail.level_learned_at}`;
      if (!grouped.has(key)) grouped.set(key, { move: move.name, level: detail.level_learned_at, versionGroups: [] });
      grouped.get(key).versionGroups.push(detail.version_group.name);
    }
  }
  const entries = [...grouped.values()]
    .map((entry) => {
      const versionGroups = [...new Set(entry.versionGroups)].sort();
      return {
        ...entry,
        versionGroups: versionGroups.slice(0, 8),
        additionalVersionGroups: Math.max(versionGroups.length - 8, 0) || undefined
      };
    })
    .sort((left, right) => left.level - right.level || left.move.localeCompare(right.move));

  return {
    note: 'Level 0 means a starting move. Version groups show where the move and level differ between games.',
    total: entries.length,
    shown: entries.slice(0, maximum),
    truncated: entries.length > maximum
  };
}

async function buildPokemonProfile(client, nameOrId) {
  const pokemon = await readJson(await client.getPokemon(nameOrId), `Pokémon "${nameOrId}"`);
  const species = await readJson(await client.getByUrl(pokemon.species.url), 'Pokémon species');
  const [evolutionChain, pokedexes] = await Promise.all([
    readJson(await client.getByUrl(species.evolution_chain.url), 'Evolution chain'),
    Promise.all(species.pokedex_numbers.map(async ({ entry_number, pokedex }) => {
      const dex = await readJson(await client.getByUrl(pokedex.url), 'Regional Pokédex');
      return { region: dex.region?.name || null, pokedex: pokedex.name, entryNumber: entry_number };
    }))
  ]);

  const regionalCoverage = [...pokedexes.reduce((regions, entry) => {
    if (!entry.region) return regions;
    if (!regions.has(entry.region)) regions.set(entry.region, { region: entry.region, pokedexes: [] });
    regions.get(entry.region).pokedexes.push({ name: entry.pokedex, entryNumber: entry.entryNumber });
    return regions;
  }, new Map()).values()];

  return {
    pokemon: {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map(({ type }) => type.name),
      heightMetres: pokemon.height / 10,
      weightKilograms: pokemon.weight / 10,
      abilities: pokemon.abilities.map(({ ability, is_hidden }) => ({ name: ability.name, hidden: is_hidden })),
      legendary: species.is_legendary,
      mythical: species.is_mythical
    },
    regionalCoverage,
    regionalPokedexNote: 'This is regional Pokédex coverage. Wild encounter locations can vary by game version.',
    evolutionLine: summariseEvolution(evolutionChain.chain),
    levelUpMoves: levelUpMoves(pokemon.moves)
  };
}

module.exports = { buildPokemonProfile, levelUpMoves, summariseEvolution };
