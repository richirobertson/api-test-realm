# PokéAPI testing example: project overview

## What this repository is

This is primarily a practical demonstration of what thoughtful API testing can look like in a small, understandable Node.js project. It uses the public [PokéAPI](https://pokeapi.co/) as a realistic external dependency and combines Jest, Supertest, and JSON Schema validation to show how an automated API test suite can provide useful confidence without becoming brittle or expensive to maintain.

The project also includes a small `poke` command-line explorer. That part is deliberately fun: it turns Pokémon API data into concise terminal output, can answer direct and cross-resource questions, and can optionally render artwork in the terminal. It gives the test suite a genuine consumer to protect, rather than treating tests as an isolated exercise.

## Purpose

The repository is designed to make a clear point: good API testing is not just sending requests and checking for a `200` response. It is about choosing the right risks to test, separating fast deterministic feedback from real integration checks, and making failures easy to understand.

It demonstrates how to:

- Test a local API and an external API consumer with fast, repeatable mocked tests.
- Run live checks against a public dependency without turning that dependency's availability into a pull-request blocker.
- Check contracts, data relationships, pagination, error paths, response quality, and representative data sets.
- Use constrained JSON Schemas that protect important consumer expectations while allowing harmless API evolution.
- Produce useful CI evidence through test reports, coverage artifacts, linting, formatting checks, and CodeQL security scanning.

## How it works

There are two complementary test layers.

- **Deterministic mocked tests** check the Express application, CLI behaviour, API-client failures and retries, and query services. They are fast and repeatable, making them strong pull-request feedback.
- **Live integration tests** check real PokéAPI contracts, cross-resource journeys, pagination, boundaries, and response quality. They confirm that the external integration behaves as expected in the real world.

The distinction is intentional. A failure in the mocked suite points directly to a repository change. A live failure may instead reflect a public-service outage, changed data, or network conditions. Keeping those signals separate makes the team’s response more accurate.

The CLI is the project’s consumer-facing example. It can retrieve a curated Pokémon profile, search a region by Pokémon type, or find Pokémon that learn a given move. These features provide realistic examples of API composition: resolving resources, following references, handling missing data, and presenting a useful result rather than exposing raw payloads.

## What good API testing looks like here

The tests avoid a few common traps:

- They do not rely on full-response snapshots or exact public collection counts, which would create noise as public data evolves.
- They test stable, meaningful consumer contracts rather than implementation trivia.
- They exercise negative and boundary cases, not just happy paths.
- They validate relationships between resources, such as a Pokémon, its species, and its evolution chain.
- They keep public-service availability out of the main merge gate while retaining live tests for deliberate integration validation.

This is a deliberately small example, not a claim that one test approach fits every product. Its value is in making the choices visible: what is being checked, why it is being checked, and what a failure should tell the team.

## CI and engineering feedback

Pull requests run deterministic tests and publish a Jest JSON report and coverage artifacts even if the tests fail. This gives reviewers and engineers evidence to inspect directly in GitHub Actions instead of requiring a local rerun.

The repository also provides ESLint and Prettier gates for maintainability, while GitHub CodeQL default setup scans the JavaScript/TypeScript code for security issues. Live checks are manually triggered and publish their own JSON report, keeping external-dependency validation available without making routine changes dependent on a public API’s uptime.

## Who this is for

### Senior test engineers and test engineering leaders

The project is a compact discussion piece for test strategy: test-pyramid choices, contract scope, external dependency management, actionable CI signals, and the trade-off between confidence and maintenance cost. It is intended to be inspected and challenged, not followed as a rigid template.

### Developers, product owners, and business analysts

It shows how automated API tests can protect behaviour that matters to users: useful search results, sensible error handling, compatibility with an upstream service, and reliable release feedback. The CLI helps make that value visible without requiring readers to parse a large API response.

### Junior test engineers and prospective employers

The code and tests are intentionally approachable. They show practical techniques—mocking, schemas, data-driven tests, reusable helpers, and CI artifacts—in a real integration-shaped example. The project is also designed to show that API testing can be both rigorous and enjoyable: the Pokémon theme and terminal explorer are there to make the learning experience more memorable, not to distract from the engineering.

## In short

This repository demonstrates versatile automated API testing with a small amount of fun built in. Its central message is simple: a good API test suite gives teams clear, proportionate confidence in the behaviour they own, while treating external systems and changing data with the care they require.
