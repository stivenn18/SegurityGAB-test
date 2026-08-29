import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

import { AuthProvider } from '../context/AuthContext';
import FormLogin from '../components/FormLogin';

describe('Login flow (integration)', () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
    (global as any).fetch = jest.fn();
    (global as any).alert = jest.fn();
    process.env.NEXT_PUBLIC_API_URL = 'http://example.com';
  });

  it('login exitoso admin -> guarda token/user y redirige a /dashboard/admin', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 't1',
        user: { name: 'Admin', email: 'admin@example.com', role: 'admin' },
      }),
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <FormLogin />
      </AuthProvider>,
    );

    await user.type(screen.getByPlaceholderText(/email/i), 'admin@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'secret');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/admin'));

    expect(localStorage.getItem('token')).toBe('t1');
    expect(JSON.parse(localStorage.getItem('user') as string)).toEqual({
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    });

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'secret' }),
    });
  });
});
