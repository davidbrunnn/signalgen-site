// One place for the signing secrets (13/10/2026). DOWNLOAD_SECRET / AUTH_SECRET when set; otherwise a key derived from the other
// secrets the deployment already holds, so production never signs with a public default. Only a bare local checkout uses the dev value.
import { createHash } from 'crypto';

export function secretFor(purpose: 'download' | 'auth'): string {
  const dl = process.env.DOWNLOAD_SECRET;
  if (purpose === 'download' && dl) return dl;
  const explicit = process.env.AUTH_SECRET || dl;
  if (purpose === 'auth' && explicit) return `auth|${explicit}`;
  const pool = [process.env.STRIPE_WEBHOOK_SECRET, process.env.BLOB_READ_WRITE_TOKEN, process.env.LICENSE_SEED_HEX, process.env.PUBLISH_TOKEN].filter(Boolean).join('|');
  if (pool) return createHash('sha256').update(`sg|${purpose}|${pool}`).digest('hex');
  return 'dev-secret-change-me';
}
