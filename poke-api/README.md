# PokéAPI testing example

A self-contained PokéAPI testing example using Jest, Supertest, Ajv, and live public-API checks.

## Getting started

```sh
cd poke-api
npm install
npm test
npm run test:live
npm start
```

The example health endpoint is available at `GET /health`.

## Test suites

- `npm test` runs deterministic local unit tests.
- `npm run test:live` calls the public PokéAPI, validates a constrained contract for `GET /pokemon/pikachu`, and confirms Pikachu resolves consistently by name and ID.
- The live suite also applies reusable pagination checks to `GET /pokemon?limit=10&offset=20`, including distinct resources and fully navigable next/previous links.
- A cross-resource journey starts at Pikachu, follows the linked species and evolution-chain resources, and verifies that the species occurs in the resulting evolution tree.
- Negative and boundary coverage exercises invalid Pokémon lookups and malformed paths, plus extreme collection pagination values, while asserting response status and media type rather than error-message text.
- Data-driven coverage applies shared response invariants to a deliberately varied sample: Pikachu, Bulbasaur, Eevee, Mewtwo, and Deoxys-Normal.
- Response-quality checks validate JSON media type, uniqueness within relationship lists, published API-reference URLs, and a deliberately lenient public-API response-time threshold.
- `npm run test:all` runs both suites.

Set `POKEAPI_BASE_URL` to point the live suite at a compatible alternate environment.

## Architecture

- `test/live/` — real PokéAPI smoke, contract, integration, boundary, and quality checks.
- `test/mocked/` — deterministic local and mocked-HTTP tests, including client retry and error behaviour.
- `test/schemas/` — reusable constrained JSON Schemas.
- `test/support/` — configuration, the reusable API client, custom Jest matchers, test data, and shared suites.

Copy `.env.example` to `.env` to configure `POKEAPI_BASE_URL`, `POKEAPI_TIMEOUT_MS`, and optional comma-separated `POKEAPI_TEST_TAGS`. `.env` is deliberately ignored by Git.
