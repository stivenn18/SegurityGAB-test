describe('services/api', () => {
  beforeEach(() => {
    jest.resetModules();
    (global as any).fetch = jest.fn();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('loginUser llama al endpoint /login con POST y body', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://example.com';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 't' }),
    });

    const { loginUser } = await import('./api');

    await expect(loginUser('a@a.com', 'pass')).resolves.toEqual({ access_token: 't' });

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@a.com', password: 'pass' }),
    });
  });

  it('loginUser lanza Error si res.ok es false', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://example.com';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'bad' }),
    });

    const { loginUser } = await import('./api');

    await expect(loginUser('a@a.com', 'pass')).rejects.toThrow('Login failed');
  });
});
