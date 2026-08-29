// services/api.ts
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  return res.json();
}
