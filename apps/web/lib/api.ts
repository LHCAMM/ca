const apiBase = process.env.API_BASE_URL || 'http://api:3001';
const user = process.env.BASIC_AUTH_USER || 'admin';
const pass = process.env.BASIC_AUTH_PASSWORD || 'change-me';

const authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

export async function getJson(path: string) {
  const res = await fetch(`${apiBase}${path}`, { cache: 'no-store', headers: { Authorization: authHeader } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function post(path: string) {
  const res = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { Authorization: authHeader, 'content-type': 'application/json' } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
