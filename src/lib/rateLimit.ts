const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS    = 60_000; // fenêtre glissante : 1 minute
const MAX_REQUESTS = 10;     // requêtes max par IP par fenêtre

export function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}
