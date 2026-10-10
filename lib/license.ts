// SGN1 license check on the site (the same check the plugins do offline, plugins/signalgen-v5/Source/LicenseKey.h).
//   key = "SGN1-" + base32(payload 13 bytes + Ed25519 signature of "SGN1" + payload), groups of 8
//   payload = version 1 · product · edition · serial u32 · day u16 since 2026-01-01 · sha512(email)[:4]
// Only the PUBLIC key lives here; the private seed never leaves the Mac / the pay/ environment.
import { createHash, createPublicKey, verify } from 'node:crypto';

const PUBLIC_HEX = process.env.LICENSE_PUBLIC_HEX || 'd6becb0586afff69fe10626ceaf3404b5a3ac7386420f30d95ad83ec62fc73ca';
export const PRODUCT_NAMES: Record<number, string> = { 1: 'signalgen', 2: 'mix', 3: 'sounds', 4: 'refiner', 5: 'monet', 6: 'ear', 7: 'strip', 8: 'tempo', 9: 'bundle' };
export const EDITION_NAMES: Record<number, string> = { 1: 'founder', 2: 'full', 3: 'nfr', 4: 'trial' };

export type License = { serial: number; product: string; edition: string; day: number };

function unb32(s: string): Buffer | null {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, val = 0; const out: number[] = [];
  for (const ch of s) {
    const i = A.indexOf(ch); if (i < 0) return null;
    val = ((val << 5) | i) & 0xffff; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

/** null when the key is malformed, forged, or was issued to another e-mail */
export function checkKey(key: string, email: string): License | null {
  const k = String(key || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!k.startsWith('SGN1-')) return null;
  const raw = unb32(k.slice(5).replace(/-/g, ''));
  if (!raw || raw.length < 77) return null;
  const payload = raw.subarray(0, 13), sig = raw.subarray(13, 77);
  if (payload[0] !== 1) return null;
  try {
    const pub = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(PUBLIC_HEX, 'hex')]), format: 'der', type: 'spki' });
    if (!verify(null, Buffer.concat([Buffer.from('SGN1'), payload]), pub, sig)) return null;
  } catch { return null; }
  const tag = createHash('sha512').update(String(email).trim().toLowerCase(), 'utf8').digest().subarray(0, 4);
  if (!tag.equals(payload.subarray(9, 13))) return null;
  return { serial: payload.readUInt32BE(3), product: PRODUCT_NAMES[payload[1]] || 'unknown', edition: EDITION_NAMES[payload[2]] || 'unknown', day: payload.readUInt16BE(7) };
}
