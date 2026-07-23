# Open-Meteo testing example

An API-testing example using Jest and the public [Open-Meteo APIs](https://open-meteo.com/en/docs). Its purpose is to demonstrate consumer-focused testing for parameter-driven, time-series data.

N.B. this project does not treat Open-Meteo availability as a merge condition.

## What this repository demonstrates

This is deliberately both a testing showcase and a small working CLI.

For a fuller explanation of the project's purpose, testing approach, and intended audience, see [the project overview](PROJECT_OVERVIEW.md).

- **API testing practice:** deterministic mocked tests, live contract checks, error handling, time-series alignment, multi-location responses, units, timezones, historical data, and CI evidence that separates repository regressions from public-API availability.
- **Consumer-focused functionality:** the `weather` command turns geocoding and forecast data into a concise terminal summary with readable conditions and local weather symbols.

The combination is intentional: the CLI provides a realistic consumer of the API, while the test suite shows how to verify a parameter-driven integration responsibly.

## Quick start

```sh
cd open-meteo
# Requires Node.js 24 LTS (use `nvm use` if you have nvm installed)
npm install
npm link

# Optional: render local weather symbols and the sunshine test-success GIF
brew install chafa

npm test
npm run test:live
```

This project requires Node.js 24 LTS. `npm link` makes `weather` available as a short local command. Chafa is an optional visual enhancement: without it, every command still works normally and emits readable JSON without image links. `npm test` is deterministic. `npm run test:live` makes real calls to Open-Meteo. `npm run test:all` runs both levels together.

## Terminal explorer

The first user-facing feature is a `weather` command:

```sh
weather London
weather "New York"
```

It resolves the supplied place through Open-Meteo's geocoding API, then uses the chosen result's coordinates to request current weather and a short daily forecast.

The command presents a concise, readable JSON summary rather than expose the upstream payload directly. Its output includes the selected location, administrative area, country, coordinates, elevation, population where available, timezone, observation time, readable conditions, explicit units, and a short daily forecast.

When the terminal supports colour, the selected location is warm orange while country, timezone, and weather-condition values receive distinct contextual colours. The same command still produces valid uncoloured JSON when colour is unavailable, which keeps it useful in pipes and automation.

When [Chafa](https://hpjansson.org/chafa/) is installed, a matching local weather symbol is rendered above the JSON—directly before the `current.conditions` value. Symbols are repository-owned assets, selected from the Open-Meteo weather code; the JSON never includes external image links.

Every successful completed test command renders the repository-owned sunshine GIF in `assets/test-success.gif` when [Chafa](https://hpjansson.org/chafa/) is installed (`brew install chafa`). It is a small visual success cue only: a test failure stops the command before the GIF runs, and without Chafa the command prints a short success message instead.

## Reading test output

All test commands run Jest in verbose mode. Each line identifies the behaviour being checked and failures include the relevant expectation or error. Use the commands according to the certainty you need:

- `npm test` — deterministic mocked tests; the fastest feedback for repository changes.
- `npm run lint` — checks JavaScript with ESLint.
- `npm run format:check` — verifies Prettier formatting without changing files.
- `npm run test:mocked:report` — runs mocked tests and writes Jest JSON results plus LCOV coverage to `reports/` and `coverage/`.
- `npm run test:live` — real Open-Meteo checks; useful when validating the public integration.
- `npm run test:all` — runs both levels together.

Both test layers can also write machine-readable evidence for CI:

```sh
npm run test:mocked:report
npm run test:live:report
```

## Contract boundaries

The implemented vertical slice makes these behaviours explicit:

- A recognised place returns a profile for the location selected from the geocoding result.
- The forecast request uses the selected result's latitude and longitude, not coordinates derived independently or supplied by the user.
- The profile retains the upstream timezone so weather values can be interpreted correctly.
- An empty or malformed place input produces a clear local validation error.
- A place with no geocoding matches produces a clear, non-successful result without attempting a forecast request.
- An upstream error or timeout produces a useful consumer-facing error without leaking implementation details.

## Initial testing strategy

The deterministic mocked tests cover:

- Geocoding and forecast request construction, including required query parameters.
- The geocoding-to-forecast journey and the exact coordinates carried between calls.
- Curated response shape and essential field types.
- Empty results, invalid input, upstream HTTP errors, and transient network failures.

The opt-in live suite validates a known London geocoding result, forecast response media type and essential fields, geographic and timezone consistency, aligned and ordered daily time-series data, and rejection of impossible coordinates. It also checks that multi-location responses become a list of location-specific forecast objects, explicit Fahrenheit/mph units are reflected in the response metadata, and a fixed historical date range returns the requested daily series. It deliberately avoids asserting weather values: those are expected to change. An Open-Meteo outage or network failure can therefore affect only the manual live command, never the normal mocked-test gate.

## Broader API-testing coverage

The client supports forecast units, named timezones, comma-separated multi-location coordinates, and historical daily data. Mocked tests lock down each request's parameters; live tests validate the provider's distinct response shapes and data-quality rules. These checks complement the resource-graph and pagination focus of the PokéAPI example.

## CI evidence and rationale

Pull requests run `npm run test:mocked:report` for this section. The workflow uploads a Jest JSON result and LCOV/JSON coverage artifacts even if the test command fails, so a reviewer can inspect evidence without reproducing the run locally.

Live Open-Meteo checks are started manually. They upload their own Jest JSON report, but remain outside the pull-request gate because public-service availability and changing data are not repository regressions. This mirrors a practical testing strategy: fast, deterministic checks decide whether a change is safe to merge; live checks provide deliberate integration confidence.
