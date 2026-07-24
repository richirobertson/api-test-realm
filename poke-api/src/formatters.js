const pc = require("picocolors");

function paint(enabled, color, value) {
  return enabled ? color(String(value)) : String(value);
}

function words(value) {
  return String(value || "—").replaceAll("-", " ");
}

function list(values, mapper = words) {
  return values?.length ? values.map(mapper).join(", ") : "None";
}

function heading(title, colorsEnabled) {
  return `\n${paint(colorsEnabled, pc.bold, title)}\n${paint(
    colorsEnabled,
    pc.dim,
    "─".repeat(62),
  )}`;
}

function label(name, value, colorsEnabled) {
  return `  ${paint(colorsEnabled, pc.dim, name.padEnd(14))} ${value}`;
}

function evolutionLines(node, prefix = "") {
  if (!node) return [];
  const lines = [`  ${prefix}${words(node.species)}`];
  for (const evolution of node.evolvesTo || []) {
    const conditions = (evolution.conditions || [])
      .flatMap((condition) =>
        Object.entries(condition).map(
          ([key, value]) => `${words(key)} ${words(value)}`,
        ),
      )
      .join(", ");
    lines.push(
      ...evolutionLines(
        evolution,
        `${prefix}${conditions ? `→ (${conditions}) ` : "→ "}`,
      ),
    );
  }
  return lines;
}

function formatMoves(levelUpMoves, colorsEnabled) {
  if (!levelUpMoves?.shown?.length) return [];
  const lines = [
    heading(`LEVEL-UP MOVES (${levelUpMoves.total})`, colorsEnabled),
  ];
  for (const move of levelUpMoves.shown) {
    const level = move.level === 0 ? "Start" : `Lv ${move.level}`;
    lines.push(
      `  ${paint(colorsEnabled, pc.yellow, level.padEnd(7))} ${words(
        move.move,
      ).padEnd(22)} ${paint(
        colorsEnabled,
        pc.dim,
        list(move.versionGroups),
      )}${move.additionalVersionGroups ? ` +${move.additionalVersionGroups} more` : ""}`,
    );
  }
  if (levelUpMoves.truncated)
    lines.push(paint(colorsEnabled, pc.dim, "  More moves are available."));
  return lines;
}

function formatPokemonProfile(profile, colorsEnabled = pc.isColorSupported) {
  const pokemon = profile.pokemon || {};
  const badges = [
    pokemon.legendary && "LEGENDARY",
    pokemon.mythical && "MYTHICAL",
  ].filter(Boolean);
  const lines = [
    heading(
      `#${String(pokemon.id ?? "—").padStart(4, "0")}  ${words(
        pokemon.name,
      ).toUpperCase()}${badges.length ? `  ✦ ${badges.join(" · ")}` : ""}`,
      colorsEnabled,
    ),
    label("Type", list(pokemon.types), colorsEnabled),
    label("Height", `${pokemon.heightMetres ?? "—"} m`, colorsEnabled),
    label("Weight", `${pokemon.weightKilograms ?? "—"} kg`, colorsEnabled),
    label(
      "Abilities",
      list(
        pokemon.abilities,
        (ability) =>
          `${words(ability.name)}${ability.hidden ? " (hidden)" : ""}`,
      ),
      colorsEnabled,
    ),
  ];

  if (profile.pokedexDescription?.length) {
    lines.push(heading("POKÉDEX", colorsEnabled));
    for (const entry of profile.pokedexDescription)
      lines.push(
        `  ${paint(colorsEnabled, pc.dim, `${words(entry.game)}:`)} ${entry.wording}`,
      );
  }
  if (profile.regionalCoverage?.length) {
    lines.push(heading("REGIONAL POKÉDEX", colorsEnabled));
    for (const coverage of profile.regionalCoverage)
      lines.push(
        label(
          words(coverage.region),
          list(
            coverage.pokedexes,
            (dex) => `${words(dex.name)} #${dex.entryNumber}`,
          ),
          colorsEnabled,
        ),
      );
  }
  lines.push(
    heading("EVOLUTION", colorsEnabled),
    ...evolutionLines(profile.evolutionLine),
  );
  lines.push(...formatMoves(profile.levelUpMoves, colorsEnabled), "");
  return lines.join("\n");
}

function formatRegionProfile(profile, colorsEnabled = pc.isColorSupported) {
  const lines = [
    heading(
      `${words(profile.pokemon).toUpperCase()}  •  ${words(profile.region).toUpperCase()}`,
      colorsEnabled,
    ),
    paint(colorsEnabled, pc.bold, "  Encounter locations"),
  ];
  if (!profile.locations?.length)
    lines.push("  No recorded encounter locations.");
  for (const location of profile.locations || [])
    lines.push(
      `  • ${words(location.area)}  ${paint(colorsEnabled, pc.dim, list(location.methods))}`,
    );
  lines.push(...formatMoves(profile.levelUpMoves, colorsEnabled), "");
  return lines.join("\n");
}

function formatMoveProfile(profile, colorsEnabled = pc.isColorSupported) {
  const lines = [
    heading(
      `${words(profile.pokemon).toUpperCase()}  •  ${words(profile.move).toUpperCase()}`,
      colorsEnabled,
    ),
    paint(colorsEnabled, pc.bold, "  How it learns this move"),
  ];
  for (const entry of profile.learning || [])
    lines.push(
      `  • ${words(entry.method)}${entry.level ? ` at level ${entry.level}` : ""}  ${paint(
        colorsEnabled,
        pc.dim,
        words(entry.versionGroup),
      )}`,
    );
  lines.push("");
  return lines.join("\n");
}

function formatSearchSummary(result, colorsEnabled = pc.isColorSupported) {
  return [
    heading(
      `${words(result.region).toUpperCase()}  •  ${words(result.name).toUpperCase()}`,
      colorsEnabled,
    ),
    `  ${result.resultCount} Pokémon match this ${result.kind}.`,
    "",
  ].join("\n");
}

function formatSearchResult(pokemon, colorsEnabled = pc.isColorSupported) {
  const lines = [
    paint(
      colorsEnabled,
      pc.bold,
      `#${String(pokemon.entryNumber).padStart(3, "0")}  ${words(
        pokemon.name,
      ).toUpperCase()}`,
    ),
  ];
  for (const encounter of pokemon.encounters || [])
    lines.push(
      `  ${words(encounter.area)}  ${paint(
        colorsEnabled,
        pc.dim,
        `${list(encounter.methods)} · ${list(encounter.versions)}`,
      )}`,
    );
  for (const learning of pokemon.learning || [])
    lines.push(
      `  ${words(learning.method)}${learning.level ? ` · Lv ${learning.level}` : ""}  ${paint(
        colorsEnabled,
        pc.dim,
        list(learning.versionGroups),
      )}`,
    );
  if (!(pokemon.encounters?.length || pokemon.learning?.length))
    lines.push(paint(colorsEnabled, pc.dim, "  No additional details."));
  return lines.join("\n");
}

function formatMoreResults(count, colorsEnabled = pc.isColorSupported) {
  return paint(colorsEnabled, pc.dim, `… ${count} more results not shown.`);
}

function formatError(message, colorsEnabled = pc.isColorSupported) {
  return `${paint(colorsEnabled, pc.red, "✖")} ${paint(
    colorsEnabled,
    pc.bold,
    "Pokémon lookup failed",
  )}\n  ${message}`;
}

function formatAlternateArtworkNote(
  pokemon,
  colorsEnabled = pc.isColorSupported,
) {
  return `\n${paint(colorsEnabled, pc.bold, "GAME SPRITE")}\n${paint(
    colorsEnabled,
    pc.dim,
    `  ${pokemon.alternateImageSource || "Game sprite unavailable"}`,
  )}`;
}

function formatShinyArtworkNote(pokemon, colorsEnabled = pc.isColorSupported) {
  return `\n${paint(colorsEnabled, pc.bold, "✦ SHINY FORM")}\n${paint(
    colorsEnabled,
    pc.dim,
    `  ${words(pokemon.name)} in its alternate shiny colours`,
  )}`;
}

module.exports = {
  formatAlternateArtworkNote,
  formatError,
  formatMoreResults,
  formatMoveProfile,
  formatPokemonProfile,
  formatRegionProfile,
  formatSearchResult,
  formatSearchSummary,
  formatShinyArtworkNote,
};
