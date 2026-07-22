# Open-Meteo testing example

## Status

This section defines the first increment of an Open-Meteo API-testing example. It intentionally sets the consumer contract and its test boundaries before implementation begins.

The completed example will sit alongside `poke-api/` as a self-contained Node.js project. It will use the public [Open-Meteo APIs](https://open-meteo.com/en/docs) to demonstrate API testing for parameter-driven, time-series data.

## First increment: weather by place

The first user-facing feature will be a `weather` command:

```sh
weather London
weather "New York"
```

It will resolve the supplied place through Open-Meteo's geocoding API, then use the chosen result's coordinates to request current weather and a short daily forecast.

The command will present a concise, readable JSON summary rather than expose the upstream payload directly. Its initial output will include the selected location, country, coordinates, timezone, current conditions, and a short daily forecast.

## Contract boundaries

The first implementation will make these behaviours explicit:

- A recognised place returns a profile for the location selected from the geocoding result.
- The forecast request uses the selected result's latitude and longitude, not coordinates derived independently or supplied by the user.
- The profile retains the upstream timezone so weather values can be interpreted correctly.
- An empty or malformed place input produces a clear local validation error.
- A place with no geocoding matches produces a clear, non-successful result without attempting a forecast request.
- An upstream error or timeout produces a useful consumer-facing error without leaking implementation details.

## Initial testing strategy

The first automated increment will concentrate on deterministic mocked tests. They will cover:

- Geocoding and forecast request construction, including required query parameters.
- The geocoding-to-forecast journey and the exact coordinates carried between calls.
- Curated response shape and essential field types.
- Empty results, invalid input, upstream HTTP errors, and transient network failures.

Live Open-Meteo checks are deliberately a later phase. They will validate the real provider's response quality and data relationships, but will remain opt-in so an external outage cannot block repository changes.

## Planned growth

After the initial vertical slice, this example will add multi-location response shapes, units and timezones, time-series alignment, and historical-weather date-range scenarios. Those additions are intended to complement the resource-graph and pagination focus of the PokéAPI example.
