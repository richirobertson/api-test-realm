const { createPokeApiClient } = require("../../src/poke-api-client");

const clientOptions = {
  baseUrl: "https://pokeapi.example/api/v2",
  timeoutMs: 50,
  retries: 1,
};

describe("PokéAPI client: deterministic transport behaviour", () => {
  it("builds the expected resource URL and returns a successful response", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(
      new Response('{"name":"pikachu"}', {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createPokeApiClient({
      ...clientOptions,
      fetchImplementation,
    });

    const response = await client.getPokemon("pikachu");

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://pokeapi.example/api/v2/pokemon/pikachu",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(await response.json()).toEqual({ name: "pikachu" });
  });

  it("retries a transient transport failure once before succeeding", async () => {
    const fetchImplementation = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const client = createPokeApiClient({
      ...clientOptions,
      fetchImplementation,
    });

    const response = await client.getPokemon(25);

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("returns an HTTP error response without retrying it", async () => {
    const fetchImplementation = jest
      .fn()
      .mockResolvedValue(new Response("Not Found", { status: 404 }));
    const client = createPokeApiClient({
      ...clientOptions,
      fetchImplementation,
    });

    const response = await client.getPokemon("unknown");

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
  });

  it("surfaces a transport failure after configured retries are exhausted", async () => {
    const failure = new Error("network unavailable");
    const fetchImplementation = jest.fn().mockRejectedValue(failure);
    const client = createPokeApiClient({
      ...clientOptions,
      fetchImplementation,
    });

    await expect(client.getPokemon("pikachu")).rejects.toThrow(
      "network unavailable",
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });
});
