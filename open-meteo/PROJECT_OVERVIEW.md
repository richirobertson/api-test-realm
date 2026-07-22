# Open-Meteo example: project overview

## Purpose

This is a focused demonstration of API testing for a parameter-driven, time-series provider. The `weather` CLI is a small consumer that combines geocoding with forecast data, giving the tests a realistic workflow to protect.

## What it demonstrates

- Deterministic testing of URL/query construction, retries, error handling, and data hand-off between APIs.
- Live contract checks that avoid fragile assertions about variable weather values.
- Time-series quality checks: aligned parallel arrays, ordered dates, and closed historical ranges.
- Response-shape changes when one forecast location becomes many.
- Unit and timezone metadata as part of the consumer contract, rather than presentation details.
- CI evidence that separates repository-owned failures from public-provider availability.

## Why it complements PokéAPI

PokéAPI provides rich examples of resource relationships and pagination. Open-Meteo adds a different class of API risk: optional query parameters materially change returned units, timezone interpretation, response shape, and time-series data. Together, the two sections show that useful API testing adapts to the API's domain rather than applying one generic checklist.
