
/** Uploads an image to POST /media as the signed-in staff member; resolves to its /media/… URL. */
export async function uploadImage(file: File): Promise<string> {
  const csrf = await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json() as Promise<{ token: string }>);
  const body = new FormData(); body.append('image', file);
  const response = await fetch('/media', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf.token }, body });
  const result = await response.json().catch(() => null) as { url?: unknown; error?: unknown } | null;
  if (!response.ok || typeof result?.url !== 'string') throw new Error(typeof result?.error === 'string' ? result.error : 'The image could not be uploaded.');
  return result.url;
}
