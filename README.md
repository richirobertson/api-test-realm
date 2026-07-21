# API Test Realm

A small Express API starter with Jest and Supertest.

## Getting started

```sh
npm install
npm test
npm run test:live
npm start
```

The example health endpoint is available at `GET /health`.

## Test suites

- `npm test` runs deterministic local unit tests.
- `npm run test:live` calls the public PokéAPI, validates a constrained contract for `GET /pokemon/pikachu`, and confirms Pikachu resolves consistently by name and ID.
- `npm run test:all` runs both suites.

Set `POKEAPI_BASE_URL` to point the live suite at a compatible alternate environment.
