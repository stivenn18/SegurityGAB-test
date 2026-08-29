import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isLoggedIn es false si no hay token', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  it('isLoggedIn es true si hay token en localStorage', async () => {
    localStorage.setItem('token', 't1');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });
  });
});
