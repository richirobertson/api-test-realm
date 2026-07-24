const { stripVTControlCharacters } = require("node:util");

jest.mock("../../src/image-renderer", () => ({
  isChafaAvailable: jest.fn(() => true),
  renderThumbnail: jest.fn(async () => "rendered-pokemon-image"),
}));

const { run } = require("../../src/cli");
const { renderThumbnail } = require("../../src/image-renderer");

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("PokéAPI terminal CLI", () => {
  it("prints a structured profile for a direct lookup", async () => {
    const stdout = jest.fn();
    const client = {
      getPokemon: jest.fn().mockResolvedValue(
        jsonResponse({
          id: 25,
          name: "pikachu",
          height: 4,
          weight: 60,
          types: [{ type: { name: "electric" } }],
          abilities: [{ ability: { name: "static" }, is_hidden: false }],
          stats: [{ stat: { name: "speed" }, base_stat: 90 }],
          species: { url: "species" },
          moves: [],
          sprites: {
            other: {
              "official-artwork": {
                front_default: "https://example.test/pikachu.png",
                front_shiny: "https://example.test/pikachu-shiny.png",
              },
              showdown: {
                front_default: "https://example.test/pikachu-battle.gif",
              },
            },
          },
        }),
      ),
    };

    client.getByUrl = jest.fn((url) =>
      Promise.resolve(
        jsonResponse(
          url === "species"
            ? {
                is_legendary: false,
                is_mythical: false,
                evolution_chain: { url: "chain" },
                pokedex_numbers: [],
              }
            : { chain: { species: { name: "pikachu" }, evolves_to: [] } },
        ),
      ),
    );

    const exitCode = await run(["pikachu"], {
      client,
      stdout,
      stderr: jest.fn(),
    });

    expect(exitCode).toBe(0);
    expect(stdout).toHaveBeenCalledWith(
      expect.stringContaining("#0025  PIKACHU"),
    );
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining("EVOLUTION"));
    expect(renderThumbnail).toHaveBeenCalledTimes(3);
    expect(renderThumbnail).toHaveBeenNthCalledWith(
      1,
      "https://example.test/pikachu.png",
    );
    expect(renderThumbnail).toHaveBeenNthCalledWith(
      2,
      "https://example.test/pikachu-shiny.png",
    );
    expect(renderThumbnail).toHaveBeenNthCalledWith(
      3,
      "https://example.test/pikachu-battle.gif",
    );
    const plainOutputs = stdout.mock.calls.map(([output]) =>
      stripVTControlCharacters(output),
    );
    expect(plainOutputs).toEqual([
      "rendered-pokemon-image",
      expect.stringContaining("Type           electric"),
      expect.stringContaining("Pokémon Showdown battle sprite"),
      "rendered-pokemon-image",
      expect.stringContaining("✦ SHINY FORM"),
      "rendered-pokemon-image",
    ]);
  });

  it("returns a friendly error when a direct Pokémon lookup is unavailable", async () => {
    const stderr = jest.fn();
    const client = {
      getPokemon: jest
        .fn()
        .mockResolvedValue(new Response("", { status: 404 })),
    };

    const exitCode = await run(["missingno"], {
      client,
      stdout: jest.fn(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining('Pokémon "missingno" was not found'),
    );
  });

  it("repeats the standard image when shiny artwork is unavailable", async () => {
    renderThumbnail.mockClear();
    const stdout = jest.fn();
    const client = {
      getPokemon: jest.fn().mockResolvedValue(
        jsonResponse({
          id: 25,
          name: "pikachu",
          height: 4,
          weight: 60,
          types: [],
          abilities: [],
          moves: [],
          species: { url: "species" },
          sprites: { front_default: "https://example.test/pikachu.png" },
        }),
      ),
      getByUrl: jest.fn((url) =>
        Promise.resolve(
          jsonResponse(
            url === "species"
              ? {
                  is_legendary: false,
                  is_mythical: false,
                  evolution_chain: { url: "chain" },
                  pokedex_numbers: [],
                }
              : { chain: { species: { name: "pikachu" }, evolves_to: [] } },
          ),
        ),
      ),
    };

    await run(["pikachu"], { client, stdout, stderr: jest.fn() });

    expect(renderThumbnail).toHaveBeenCalledTimes(1);
    expect(stdout.mock.calls.map(([output]) => output)).toEqual([
      "rendered-pokemon-image",
      expect.stringContaining("PIKACHU"),
      expect.stringContaining("✦ SHINY FORM"),
      "rendered-pokemon-image",
    ]);
  });

  it("resolves multi-word Pokémon names and moves", async () => {
    renderThumbnail.mockClear();
    const moveClient = {
      getPokemon: jest.fn((name) =>
        Promise.resolve(
          name === "dragonite"
            ? jsonResponse({
                name: "dragonite",
                moves: [
                  {
                    move: { name: "dragon-rage" },
                    version_group_details: [
                      {
                        move_learn_method: { name: "level-up" },
                        level_learned_at: 15,
                        version_group: { name: "red-blue" },
                      },
                    ],
                  },
                ],
                sprites: {},
              })
            : new Response("", { status: 404 }),
        ),
      ),
      getRegion: jest.fn().mockResolvedValue(new Response("", { status: 404 })),
      getMove: jest.fn((name) =>
        Promise.resolve(
          name === "dragon-rage"
            ? jsonResponse({ name })
            : new Response("", { status: 404 }),
        ),
      ),
    };
    const stdout = jest.fn();

    await expect(
      run(["dragonite", "dragon", "rage"], {
        client: moveClient,
        stdout,
        stderr: jest.fn(),
      }),
    ).resolves.toBe(0);

    expect(moveClient.getPokemon).toHaveBeenCalledWith("dragonite");
    expect(moveClient.getMove).toHaveBeenCalledWith("dragon-rage");
    expect(stdout).toHaveBeenCalledWith(
      expect.stringContaining("DRAGONITE  •  DRAGON RAGE"),
    );

    const nameClient = {
      getPokemon: jest.fn((name) =>
        Promise.resolve(
          name === "mr-mime"
            ? jsonResponse({
                id: 122,
                name: "mr-mime",
                height: 13,
                weight: 545,
                types: [],
                abilities: [],
                moves: [],
                species: { url: "species" },
                sprites: {},
              })
            : new Response("", { status: 404 }),
        ),
      ),
      getByUrl: jest.fn((url) =>
        Promise.resolve(
          jsonResponse(
            url === "species"
              ? {
                  is_legendary: false,
                  is_mythical: false,
                  evolution_chain: { url: "chain" },
                  pokedex_numbers: [],
                }
              : { chain: { species: { name: "mr-mime" }, evolves_to: [] } },
          ),
        ),
      ),
    };

    await expect(
      run(["mr", "mime"], {
        client: nameClient,
        stdout,
        stderr: jest.fn(),
      }),
    ).resolves.toBe(0);
    expect(nameClient.getPokemon).toHaveBeenCalledWith("mr-mime");
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining("MR MIME"));
  });

  it("explains invalid or reversed combinations with valid examples", async () => {
    const stderr = jest.fn();
    const client = {
      getPokemon: jest
        .fn()
        .mockResolvedValue(new Response("", { status: 404 })),
      getRegion: jest.fn().mockResolvedValue(new Response("", { status: 404 })),
    };

    await expect(
      run(["flamethrower", "charizard"], {
        client,
        stdout: jest.fn(),
        stderr,
      }),
    ).resolves.toBe(1);

    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("the Pokémon must come first"),
    );
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("poke charizard flamethrower"),
    );
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("poke dragonite dragon rage"),
    );
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("poke mr mime galar"),
    );
  });
});
