import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

export const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Read lazily so the static project can run without operator credentials.
export const OPERATOR = {
  get email(): string {
    return required('ADMIN_EMAIL');
  },
  get password(): string {
    return required('ADMIN_PASSWORD');
  },
  get displayName(): string {
    return process.env.ADMIN_DISPLAY_NAME ?? 'Site Operator';
  },
};

// Unique per worker process, so reruns against the same database never collide.
export const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set; see tests/README.md.`);
  return value;
}
