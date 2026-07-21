// This is intentionally a constrained contract, not a snapshot of PokéAPI's full response.
// It protects the fields a typical API consumer would rely on while tolerating additive changes.
module.exports = {
  type: 'object',
  // The resource must expose its identity, physical dimensions, and key relationships.
  required: ['id', 'name', 'height', 'weight', 'types', 'abilities', 'stats'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    height: { type: 'integer', minimum: 0 },
    weight: { type: 'integer', minimum: 0 },

    // A Pokémon must have at least one typed classification with a resolvable type resource.
    types: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['slot', 'type'],
        properties: {
          slot: { type: 'integer', minimum: 1 },
          type: {
            type: 'object',
            required: ['name', 'url'],
            properties: {
              name: { type: 'string', minLength: 1 },
              url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/type/' }
            }
          }
        }
      }
    },

    // Abilities carry their visibility and slot metadata as well as a resource reference.
    abilities: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['is_hidden', 'slot', 'ability'],
        properties: {
          is_hidden: { type: 'boolean' },
          slot: { type: 'integer', minimum: 1 },
          ability: {
            type: 'object',
            required: ['name', 'url'],
            properties: {
              name: { type: 'string', minLength: 1 },
              url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/ability/' }
            }
          }
        }
      }
    },

    // Each returned stat needs numeric values and a reference to the named stat definition.
    stats: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['base_stat', 'effort', 'stat'],
        properties: {
          base_stat: { type: 'integer', minimum: 0 },
          effort: { type: 'integer', minimum: 0 },
          stat: {
            type: 'object',
            required: ['name', 'url'],
            properties: {
              name: { type: 'string', minLength: 1 },
              url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/stat/' }
            }
          }
        }
      }
    }
  }
};
