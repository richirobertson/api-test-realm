# Open-Meteo testing example

## Status

This section contains a deterministic Open-Meteo consumer and an opt-in live integration suite. It establishes the consumer contract before validating the real provider, so routine development feedback stays repeatable and external availability does not block it.

The example sits alongside `poke-api/` as a self-contained Node.js project. It uses the public [Open-Meteo APIs](https://open-meteo.com/en/docs) to demonstrate API testing for parameter-driven, time-series data.

## First increment: weather by place

The first user-facing feature is a `weather` command:

```sh
weather London
weather "New York"
```

It resolves the supplied place through Open-Meteo's geocoding API, then uses the chosen result's coordinates to request current weather and a short daily forecast.

The command presents a concise, readable JSON summary rather than expose the upstream payload directly. Its output includes the selected location, country, coordinates, timezone, current conditions, and a short daily forecast.

To install the local command and run the deterministic tests:

```sh
npm install
npm link
weather London
npm test
```

Run the real-provider checks only when deliberate integration validation is useful:

```sh
npm run test:live
```

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
