import { ENVIRONMENT } from './relay/environment';

export async function authRequest(action: string, body?: Record<string, string>, existingToken?: string) {
  const csrf = existingToken ? null : await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  const token = existingToken ? { token: existingToken } : await csrf!.json() as { token: string };
  const response = await fetch(`/auth/${action}`, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token.token }, body: JSON.stringify(body ?? {}) });
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many attempts. Try again later.' : action === 'login' ? 'Invalid username or password.' : await failureMessage(response));
  ENVIRONMENT.commitUpdate(store => { store.getRoot().invalidateRecord(); });
}

// Account endpoints return a short, user-facing { error } message.
async function failureMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof body?.error === 'string' ? body.error : 'The request failed. Try again.';
}
