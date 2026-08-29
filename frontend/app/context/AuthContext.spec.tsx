import React, { PropsWithChildren } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  it('carga token y user desde localStorage al iniciar', async () => {
    localStorage.setItem('token', 't1');
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'A', email: 'a@a.com', role: 'user' }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.token).toBe('t1'));
    expect(result.current.user).toEqual({
      name: 'A',
      email: 'a@a.com',
      role: 'user',
    });
  });

  it('login guarda en localStorage y actualiza estado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ name: 'B', email: 'b@b.com', role: 'admin' }, 't2');
    });

    await waitFor(() => expect(result.current.token).toBe('t2'));
    expect(result.current.user?.role).toBe('admin');

    expect(localStorage.getItem('token')).toBe('t2');
    expect(JSON.parse(localStorage.getItem('user') as string)).toEqual({
      name: 'B',
      email: 'b@b.com',
      role: 'admin',
    });
  });

  it('logout limpia localStorage y resetea estado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ name: 'C', email: 'c@c.com', role: 'user' }, 't3');
    });

    await waitFor(() => expect(result.current.token).toBe('t3'));

    act(() => {
      result.current.logout();
    });

    await waitFor(() => expect(result.current.token).toBeNull());
    expect(result.current.user).toBeNull();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
