const { run } = require('../../src/cli');

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

describe('PokéAPI terminal CLI', () => {
  it('prints beautified JSON for a direct lookup', async () => {
    const stdout = jest.fn();
    const client = {
      getPokemon: jest.fn().mockResolvedValue(jsonResponse({
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        types: [{ type: { name: 'electric' } }],
        abilities: [{ ability: { name: 'static' }, is_hidden: false }],
        stats: [{ stat: { name: 'speed' }, base_stat: 90 }]
      }))
    };

    const exitCode = await run(['pikachu'], { client, stdout, stderr: jest.fn() });

    expect(exitCode).toBe(0);
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining('"name": "pikachu"'));
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining('"electric"'));
  });

  it('returns a friendly error when a direct Pokémon lookup is unavailable', async () => {
    const stderr = jest.fn();
    const client = { getPokemon: jest.fn().mockResolvedValue(new Response('', { status: 404 })) };

    const exitCode = await run(['missingno'], { client, stdout: jest.fn(), stderr });

    expect(exitCode).toBe(1);
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('"error"'));
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('Pokémon \\"missingno\\" was not found'));
  });
});
