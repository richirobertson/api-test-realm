# PokéAPI testing example

An API-testing example using Jest, Supertest, Ajv, and the public [PokéAPI](https://pokeapi.co/). Its purpose is to demonstrate test design and consumer-focused API assurance.

N.B this repo does not to monitor PokéAPI availability.

## What this repository demonstrates

This is deliberately both a testing showcase and a small working CLI.

- **API testing practice:** deterministic mocked tests, live contract and journey checks, reusable schemas, data-driven coverage, negative paths, pagination, response quality, and CI that separates repository regressions from public-API availability.
- **Consumer-focused functionality:** the `poke` command turns PokéAPI resources into concise terminal output, supports direct lookups and cross-resource queries, and can render ANSI/Unicode artwork.

The combination is intentional: the CLI provides a realistic consumer of the API, while the test suite shows how to verify that kind of integration responsibly.

## Quick start

```sh
cd poke-api
npm install
npm link

# Optional: render Pokémon artwork as ANSI/Unicode thumbnails in the terminal
brew install chafa

npm test
npm run test:live
```

`npm link` makes `poke` available as a short local command. Chafa is an optional visual enhancement: without it, every command still works normally and includes an `imageUrl` in its JSON output. `npm test` is deterministic. `npm run test:live` makes real calls to PokéAPI. `npm run test:all` runs both.

## Reading test output

All test commands run Jest in verbose mode. Each line names the behaviour being checked and is marked with a green pass indicator when successful. A failure is marked clearly, followed by the failed expectation and an error diff or message that explains what did not match.

Use the commands according to the certainty you need:

- `npm test` — deterministic mocked and local tests; the fastest feedback for changes to this repository.
- `npm run test:live` — real PokéAPI checks; useful when validating the integration or investigating an external response.
- `npm run test:all` — runs both levels together.

## Terminal explorer

Use the CLI with a resource name or a criterion plus a region:

```sh
poke {{pokemon}}
poke {{type-or-move}} {{region}}
```

Every successful result and error is displayed as indented, syntax-coloured JSON. A direct lookup returns a curated profile rather than the full API payload: core facts, regional Pokédex coverage, evolution conditions, and level-up moves with version-group notes. Two terms resolve the first as a type or move, then return the matching Pokémon listed in the requested region's Pokédex.

Install [Chafa](https://hpjansson.org/chafa/) with `brew install chafa` to render ANSI/Unicode artwork thumbnails by default. Thumbnails appear above the JSON for direct lookups and for up to ten list results; without Chafa, the JSON `imageUrl` remains available.

For example:

```sh
# Curated Pokémon profile: facts, regional coverage, evolution, and level-up moves
poke pikachu

# Pokémon in a region: encounter areas/methods plus level-up move information
poke pikachu galar

# Pokémon learning a move: methods, levels, and version groups
poke charizard flamethrower

# Pokémon of a type in a region, with encounter areas, methods, and game versions
poke electric kanto

# Pokémon that learn a move in a region, with learning methods, levels, and version groups
poke flamethrower johto
poke sky attack kanto
```

For multi-word moves, write the move naturally: the CLI treats the final word as the region and converts the preceding words into the PokéAPI move name.

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
