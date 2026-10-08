// SignalGen · offline license keys ("SGN1-..."), the same bytes as plugins/signalgen-v5/tools/license/keygen.py on the Mac.
//   payload (13 bytes) = version 1 · product (1 SignalGen · 2 Mix · 3 Sounds · 9 Bundle) · edition (1 founder · 2 full · 3 nfr · 4 trial)
//                        · serial u32 · issued day u16 (days since 2026-01-01) · sha512(email trimmed, lowercase)[:4]
//   key = "SGN1-" + base32 (no padding) of payload + Ed25519(b"SGN1" + payload), in groups of 8
// The private key is the 32-byte seed in ~/Desktop/SignalGen/codigo/financeiro/licencas/private_key.hex, given to the site as
// SIGNALGEN_LICENSE_PRIVATE_KEY (hex). Ed25519 is deterministic: the same order always yields the same key, so the thank-you
// page and the email can each rebuild it without a database.
import { createHash, createPrivateKey, createPublicKey, sign, verify, KeyObject } from 'crypto';

/** the key the plugins check (plugins/signalgen-v5/license/public_key.hex); a private key that doesn't match it would sell dead keys */
export const PLUGIN_PUBLIC_KEY = process.env.SIGNALGEN_LICENSE_PUBLIC_KEY || 'd6becb0586afff69fe10626ceaf3404b5a3ac7386420f30d95ad83ec62fc73ca';

export const PRODUCTS = { signalgen: 1, mix: 2, sounds: 3, bundle: 9 } as const;
export const EDITIONS = { founder: 1, full: 2, nfr: 3, trial: 4 } as const;
export const PRODUCT_NAMES: Record<number, string> = { 1: 'SignalGen', 2: 'SignalGen Mix', 3: 'SignalGen Sounds', 9: 'SignalGen Bundle' };
const EPOCH = Date.UTC(2026, 0, 1);
const PKCS8 = Buffer.from('302e020100300506032b657004220420', 'hex');      // DER prefix of an Ed25519 private key (RFC 8410)
const SPKI = Buffer.from('302a300506032b6570032100', 'hex');

function keyFromSeed(hex: string): KeyObject {
  const seed = Buffer.from(hex.trim(), 'hex');
  if (seed.length !== 32) throw new Error('SIGNALGEN_LICENSE_PRIVATE_KEY must be the 64 hex digits of private_key.hex');
  return createPrivateKey({ key: Buffer.concat([PKCS8, seed]), format: 'der', type: 'pkcs8' });
}

export function publicHex(seedHex: string) {
  const der = createPublicKey(keyFromSeed(seedHex)).export({ format: 'der', type: 'spki' }) as Buffer;
  return der.subarray(der.length - 32).toString('hex');
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf: Buffer) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function unbase32(s: string) {
  let bits = 0, val = 0; const out: number[] = [];
  for (const c of s) {
    const i = B32.indexOf(c); if (i < 0) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export function emailTag(email: string) {
  return createHash('sha512').update(email.trim().toLowerCase(), 'utf8').digest().subarray(0, 4);
}

/** days since 2026-01-01 (UTC) of a unix time in seconds */
export function dayOf(unixSeconds: number) { return Math.max(0, Math.floor((unixSeconds * 1000 - EPOCH) / 86400000)); }

/** Online orders get serials with the top bit set (from the Stripe session id), so they never meet the Mac keygen's 1, 2, 3... */
export function serialFor(orderId: string) {
  return (0x80000000 | (createHash('sha256').update(orderId).digest().readUInt32BE(0) & 0x7fffffff)) >>> 0;
}

export function makeKey(o: { seedHex: string; email: string; product: number; edition: number; serial: number; day: number }) {
  const payload = Buffer.alloc(13);
  payload[0] = 1; payload[1] = o.product; payload[2] = o.edition;
  payload.writeUInt32BE(o.serial >>> 0, 3);
  payload.writeUInt16BE(o.day, 7);
  emailTag(o.email).copy(payload, 9);
  const sig = sign(null, Buffer.concat([Buffer.from('SGN1'), payload]), keyFromSeed(o.seedHex));
  const body = base32(Buffer.concat([payload, sig]));
  return 'SGN1-' + (body.match(/.{1,8}/g) || []).join('-');
}

/** the plugin's check, for the self-test and the thank-you page */
export function checkKey(pubHex: string, email: string, key: string) {
  const k = key.trim().toUpperCase();
  if (!k.startsWith('SGN1')) return null;
  const raw = unbase32(k.slice(4).replace(/[^A-Z2-7]/g, ''));
  const payload = raw.subarray(0, 13), sig = raw.subarray(13, 77);
  if (sig.length !== 64) return null;
  const pub = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(pubHex, 'hex')]), format: 'der', type: 'spki' });
  if (!verify(null, Buffer.concat([Buffer.from('SGN1'), payload]), pub, sig)) return null;
  if (!payload.subarray(9, 13).equals(emailTag(email))) return null;
  return { product: payload[1], edition: payload[2], serial: payload.readUInt32BE(3), day: payload.readUInt16BE(7) };
}

/** the key of one paid order (product and edition from the session metadata) */
export function keyForOrder(o: { orderId: string; email: string; created: number; product?: string; edition?: string }) {
  const seedHex = process.env.SIGNALGEN_LICENSE_PRIVATE_KEY;
  if (!seedHex) throw new Error('SIGNALGEN_LICENSE_PRIVATE_KEY is not set');
  const product = PRODUCTS[(o.product || 'signalgen') as keyof typeof PRODUCTS] || 1;
  const edition = EDITIONS[(o.edition || 'full') as keyof typeof EDITIONS] || 2;
  const serial = serialFor(o.orderId);
  return { key: makeKey({ seedHex, email: o.email, product, edition, serial, day: dayOf(o.created) }), serial, product: PRODUCT_NAMES[product] };
}

let matched: { seed: string; ok: boolean } | null = null;
/** the site's private key is the plugins' pair (checked once per seed) */
export function seedMatchesPlugin() {
  const seed = process.env.SIGNALGEN_LICENSE_PRIVATE_KEY || '';
  if (!seed) return false;
  if (!matched || matched.seed !== seed) {
    let ok = false;
    try { ok = publicHex(seed) === PLUGIN_PUBLIC_KEY.trim().toLowerCase(); } catch { ok = false; }
    matched = { seed, ok };
    if (!ok) console.error('SIGNALGEN_LICENSE_PRIVATE_KEY does not match the plugins public key: checkout stays closed');
  }
  return matched.ok;
}
