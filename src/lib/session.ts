/**
 * Identifiant de session anonyme côté client.
 * Généré une fois, persisté dans localStorage.
 */

const SESSION_KEY = "layra-session-id";

function generateId(): string {
  // crypto.randomUUID est disponible dans tous les navigateurs modernes et Node 19+
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback minimal pour environnements anciens
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
