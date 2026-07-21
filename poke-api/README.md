# PokéAPI testing example

An API-testing example using Jest, Supertest, Ajv, and the public [PokéAPI](https://pokeapi.co/). Its purpose is to demonstrate test design and consumer-focused API assurance.

N.B this repo does not to monitor PokéAPI availability.

## Quick start

```sh
cd poke-api
npm install
npm test
npm run test:live
```

`npm test` is deterministic. `npm run test:live` makes real calls to PokéAPI. `npm run test:all` runs both.

## Terminal explorer

Use the CLI with a resource name or a criterion plus a region:

```sh
npm run poke -- {{pokemon}}
npm run poke -- {{type-or-move}} {{region}}
```

Every successful result and error is displayed as indented, syntax-coloured JSON. One term looks up a Pokémon directly. Two terms resolve the first as a type or move, then return the matching Pokémon listed in the requested region's Pokédex.

For example:

```sh
npm run poke -- pikachu
npm run poke -- electric kanto
npm run poke -- flamethrower johto
```

## Scope

The live suite covers the kinds of behaviour a consumer needs confidence in:

- Smoke and constrained JSON-contract checks for `GET /pokemon/pikachu`
- Identity equivalence by Pokémon name and numeric ID
- Reusable pagination, including page navigation and unique results
- Cross-resource integrity from Pokémon to species to evolution chain
- Negative paths and pagination boundaries
- Data-driven shared invariants across a deliberately varied Pokémon sample
- Response quality: media type, list uniqueness, reference URLs, and a lenient timing ceiling

## Test pyramid and certainty levels

| Level | Location | Purpose | CI role |
| --- | --- | --- | --- |
| Deterministic | `test/mocked/` | Local app checks plus mocked client URL, error, and retry behaviour | Required on every pull request |
| Live integration | `test/live/` | Public-API contracts, journeys, and response-quality checks | Manual only; never a pull-request gate |
| Shared assets | `test/schemas/`, `test/support/` | Constrained schemas, configuration, matchers, test data, and reusable suites | Used by both levels |

This split makes failures actionable: a pull-request failure points to repository behaviour, while a live-test failure may also reflect a dependency or network condition.

## Intentional non-assertions

The suite deliberately does **not** assert:

- Total collection counts or exact list ordering beyond the scope of a page; public data evolves.
- Full response snapshots or large payload equality; additive fields and unrelated data changes should not create noise.
- Exact error-message text; callers should depend on HTTP status and media type, not implementation prose.
- Public API availability as a merge condition; that would make changes to this repository appear broken when an external service is unavailable.
- Tight response-time SLOs; the live check uses a generous threshold for signal, not a production performance commitment.

## Trade-offs

Constrained schemas intentionally favour compatibility over exhaustive specification: they protect fields a consumer relies on while allowing harmless additive changes. The representative data-driven sample demonstrates coverage design, but is not a replacement for exhaustive dataset testing. Live tests validate real integration behaviour, while mocked tests make retry and error scenarios repeatable; neither level is sufficient alone.

## Architecture and configuration

- `test/live/` — real PokéAPI smoke, contract, journey, boundary, and quality checks
- `test/mocked/` — deterministic local and mocked-HTTP tests
- `test/schemas/` — reusable constrained JSON Schemas
- `test/support/` — configuration, API client, custom matchers, test data, and shared suites

Copy `.env.example` to `.env` to configure `POKEAPI_BASE_URL`, `POKEAPI_TIMEOUT_MS`, and optional `POKEAPI_TEST_TAGS`. `.env` is ignored by Git.

## CI

GitHub Actions runs `npm run test:mocked` for every pull request. Live checks are started manually only when public-API availability is relevant; their JSON report is uploaded as a workflow artifact whether the run passes or fails.
