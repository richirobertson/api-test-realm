# Open-Meteo testing example

A practical API-testing example using Jest and the public [Open-Meteo APIs](https://open-meteo.com/en/docs). It combines a `weather` CLI with tests for geocoding, forecasts, and the time-series data behind them.

The CLI provides a realistic API consumer; the tests show how to protect it without making a public service’s availability a merge condition. For the wider project context and intended audience, see [the project overview](PROJECT_OVERVIEW.md).

## Quick start

```sh
cd open-meteo
# Node.js 24 LTS required; `nvm use` works when nvm is installed
npm install
npm link

# Optional: render local weather symbols and the success GIF
brew install chafa

npm test
npm run test:live
```

`npm link` makes `weather` available as a command. Chafa is optional: without it, the CLI still emits readable JSON. `npm test` is deterministic; `npm run test:live` calls Open-Meteo; `npm run test:all` runs both.

### Docker

Run the deterministic mocked suite in a small, dependency-isolated container:

```sh
docker build -t api-test-realm-open-meteo .
docker run --rm api-test-realm-open-meteo
```

The image uses Node 24, installs with `npm ci`, and runs `npm run test:mocked`. It has no supporting services and does not run live checks.

## Use the CLI

```sh
weather London
weather "New York"
```

The command geocodes the place, uses the selected coordinates for a forecast request, then returns a compact profile: location details, timezone, observation time, readable conditions, explicit units, and a short daily forecast.

When the terminal supports colour, the location and contextual values use distinct colours; non-interactive output remains valid JSON. With [Chafa](https://hpjansson.org/chafa/) installed, a matching repository-owned weather symbol appears above the result. Successful test commands also show the local sunshine GIF; failures stop before that success cue runs.

## Test commands

| Command                      | What it gives you                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `npm test`                   | Fast, deterministic feedback for repository changes.                                 |
| `npm run lint`               | ESLint checks.                                                                       |
| `npm run format:check`       | Prettier verification without changing files.                                        |
| `npm run test:mocked:report` | Mocked tests plus Jest JSON results and LCOV coverage in `reports/` and `coverage/`. |
| `npm run test:live`          | Real Open-Meteo integration checks.                                                  |
| `npm run test:all`           | Mocked and live checks together.                                                     |

Run `npm run test:live:report` when you also need machine-readable evidence from the live suite.

## Testing approach

**Deterministic mocked tests** verify request construction, the geocoding-to-forecast journey, selected coordinates, curated response shape, units, timezones, invalid input, empty results, HTTP failures, timeouts, and retries. They are the pull-request gate.

**Live tests** are manual. They validate known geocoding and forecast contracts, media types, geographic and timezone consistency, aligned daily series, multi-location responses, explicit units, historical dates, and impossible-coordinate handling. They do not assert weather values, because those should change.

This split keeps failures actionable: a pull-request failure points to this repository, while a live failure may involve the network or public API. It also demonstrates testing approaches that matter for parameter-driven, time-series APIs, not only simple resource lookups.

## CI evidence

Pull requests run `npm run test:mocked:report` for this example. The workflow uploads Jest JSON results and LCOV/JSON coverage even after a failed test, so reviewers can inspect the evidence without rerunning locally.

Live checks run manually and upload their own JSON report. They deliberately remain outside the pull-request gate: fast, deterministic tests decide whether a change is safe to merge; live tests provide additional integration confidence.
