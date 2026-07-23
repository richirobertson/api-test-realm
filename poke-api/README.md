# PokéAPI testing example

A practical API-testing example built with Jest, Supertest, Ajv, and the public [PokéAPI](https://pokeapi.co/). It pairs a small `poke` CLI with a test suite designed to show what useful API assurance looks like.

The CLI is deliberately part of the example: it gives the tests a realistic consumer to protect. For the wider project context and intended audience, see [the project overview](PROJECT_OVERVIEW.md).

## Quick start

```sh
cd poke-api
# Node.js 24 LTS required; `nvm use` works when nvm is installed
npm install
npm link

# Optional: render local Pokémon artwork in the terminal
brew install chafa

npm test
npm run test:live
```

`npm link` makes `poke` available as a command. Chafa is optional: without it, the CLI still works and returns image URLs in its JSON. `npm test` is deterministic; `npm run test:live` calls PokéAPI; `npm run test:all` runs both.

### Docker

The repository also includes a small, dependency-isolated mocked-test image:

```sh
docker build -t api-test-realm .
docker run --rm api-test-realm
```

It uses Node 24, installs with `npm ci`, and runs `npm run test:mocked`. It has no supporting services and does not run live checks.

## Use the CLI

```sh
poke pikachu
poke pikachu galar
poke charizard flamethrower
poke electric kanto
poke flamethrower johto
```

`poke <pokemon>` returns a curated profile rather than the full upstream payload: key facts, regional Pokédex coverage, evolution conditions, and level-up moves. Two search terms resolve a type or move and a region, then return matching Pokémon with useful encounter, learning, and version details. Multi-word moves work naturally; the final word is treated as the region.

Output is indented, syntax-coloured JSON. With [Chafa](https://hpjansson.org/chafa/) installed, direct lookups and up to ten list results show local ANSI/Unicode artwork above the JSON.

### Zsh completion

After `npm link`, Zsh can suggest Pokémon, moves, types, and regions. Install the tracked completion definition once, then refresh its local suggestion cache when needed:

```sh
mkdir -p ~/.zsh/completions
cp completions/_poke ~/.zsh/completions/_poke
fpath=(~/.zsh/completions $fpath)
autoload -Uz compinit && compinit
npm run poke:completion:refresh
```

Add the `fpath` and `compinit` lines to `~/.zshrc` to keep completion enabled. Refreshing writes a local cache under `~/.cache/poke-api-realm/` (or `$XDG_CACHE_HOME`), so normal CLI use stays fast and completion can work offline.

## Test commands

| Command                      | What it gives you                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `npm test`                   | Fast, deterministic feedback for repository changes.                                 |
| `npm run lint`               | ESLint checks.                                                                       |
| `npm run format:check`       | Prettier verification without changing files.                                        |
| `npm run test:mocked:report` | Mocked tests plus Jest JSON results and LCOV coverage in `reports/` and `coverage/`. |
| `npm run test:live`          | Real PokéAPI contract and journey checks.                                            |
| `npm run test:all`           | Mocked and live checks together.                                                     |

Jest runs in verbose mode, so successful behaviours and failed expectations are easy to identify. A repository-owned success GIF appears after a completed test command when Chafa is installed; it never runs after a failure.

### Prove a test can fail

```sh
npm run test:proof
```

This manual-only check temporarily changes the local `/health` response, runs its contract test, and restores the source. **PASS — expected failure observed** confirms that test detects the controlled defect. It is excluded from normal commands and CI; see [`test/proof/README.md`](test/proof/README.md) for detail.

## Testing approach

The suite combines two complementary levels:

- **Deterministic tests** in `test/mocked/` cover local behaviour and mocked HTTP requests, including URLs, errors, retries, schemas, and negative paths. They are required on pull requests.
- **Live integration tests** in `test/live/` exercise real PokéAPI contracts, pagination, cross-resource journeys, representative data, response quality, and boundary cases. They are manual because a public API or network issue is not a repository regression.

Shared schemas, configuration, matchers, data, and reusable suites live in `test/schemas/` and `test/support/`. Copy `.env.example` to `.env` for `POKEAPI_BASE_URL`, `POKEAPI_TIMEOUT_MS`, and optional `POKEAPI_TEST_TAGS`.

The live checks intentionally avoid brittle assertions: no full-payload snapshots, global collection counts, or exact error text. Schemas protect consumer-critical fields while accepting harmless additions, and timing checks are deliberately lenient. This keeps the suite informative when public data evolves.

## CI and security

Pull requests run `npm run test:mocked:report`. Jest JSON results (`mocked-test-report`) and LCOV/JSON coverage (`mocked-test-coverage`) upload even if a test fails, making failures easier to inspect.

Live checks are manual and upload their own JSON report. Local lint and formatting gates are available through npm, while GitHub CodeQL default setup scans the repository’s JavaScript/TypeScript on pull requests, relevant pushes, and scheduled runs.
