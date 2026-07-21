# Curated test proof

`npm run test:proof` is a manual demonstration that the mocked health-contract test can detect a known defect.

The runner displays each stage clearly: it temporarily changes the `/health` response from `{ "status": "ok" }` to `{ "status": "unhealthy" }`, runs only `test/mocked/app.test.js`, confirms that `src/app.js` has been restored, then explains the outcome.

- **PASS — expected failure observed** means the test rejected the deliberate defect.
- **FAIL — mutation survived** means the test did not catch that defect, so the contract test needs strengthening.

This is deliberately separate from `npm test`, pull-request CI, and live PokéAPI checks. It is a curated, explainable confidence demonstration rather than a normal regression test or a broad mutation-testing tool.
