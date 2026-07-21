module.exports = {
  type: 'object',
  required: ['id', 'name', 'height', 'weight', 'types', 'abilities', 'stats'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    height: { type: 'integer', minimum: 0 },
    weight: { type: 'integer', minimum: 0 },
    types: {
      type: 'array', minItems: 1,
      items: { type: 'object', required: ['slot', 'type'], properties: {
        slot: { type: 'integer', minimum: 1 },
        type: { type: 'object', required: ['name', 'url'], properties: {
          name: { type: 'string', minLength: 1 },
          url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/type/' }
        } }
      } }
    },
    abilities: {
      type: 'array', minItems: 1,
      items: { type: 'object', required: ['is_hidden', 'slot', 'ability'], properties: {
        is_hidden: { type: 'boolean' },
        slot: { type: 'integer', minimum: 1 },
        ability: { type: 'object', required: ['name', 'url'], properties: {
          name: { type: 'string', minLength: 1 },
          url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/ability/' }
        } }
      } }
    },
    stats: {
      type: 'array', minItems: 1,
      items: { type: 'object', required: ['base_stat', 'effort', 'stat'], properties: {
        base_stat: { type: 'integer', minimum: 0 },
        effort: { type: 'integer', minimum: 0 },
        stat: { type: 'object', required: ['name', 'url'], properties: {
          name: { type: 'string', minLength: 1 },
          url: { type: 'string', pattern: '^https://pokeapi\\.co/api/v2/stat/' }
        } }
      } }
    }
  }
};
