const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function registerUser(username: string, publicKey: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, publicKey }),
  });
  if (!res.ok) throw new Error('Registration failed');
}

export async function getUserPublicKey(username: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(username)}/key`);
  if (!res.ok) throw new Error(`User not found: ${username}`);
  const data = await res.json();
  return data.publicKey as string;
}

export async function getOnlineUsers(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.users as string[];
}
