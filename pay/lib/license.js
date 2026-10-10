// SignalGen license keys (SGN1-…), same format the plugins verify offline (plugins/signalgen-v5/Source/LicenseKey.h):
//   payload (13 bytes) = version 1 · product (1 SignalGen · 9 Bundle …) · edition (2 = full) · serial u32 · day u16 since 2026-01-01 · sha512(email)[:4]
//   key = "SGN1-" + base32(payload + Ed25519 signature of "SGN1" + payload), in groups of 8.
// The private seed only lives in the environment (LICENSE_SEED_HEX), never in the repo.
import { createHash, createPrivateKey, sign as edSign } from 'node:crypto';

const PRODUCTS = { signalgen: 1, mix: 2, sounds: 3, refiner: 4, monet: 5, ear: 6, strip: 7, tempo: 8, bundle: 9 };
export const EDITIONS = { founder: 1, full: 2, nfr: 3, trial: 4 };
const EPOCH = Date.UTC(2026, 0, 1);
const SERIAL_BASE = 100000;

function privateKey() {
  const hex = process.env.LICENSE_SEED_HEX || '';
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('LICENSE_SEED_HEX missing or invalid');
  const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(hex, 'hex')]);
  return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

function b32(buf) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += A[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += A[(val << (5 - bits)) & 31];
  return out;
}

// Serial derived from the Checkout Session id: stable across webhook retries, unique enough across sales.
export function serialFor(sessionId) {
  return SERIAL_BASE + (parseInt(createHash('sha256').update(sessionId).digest('hex').slice(0, 7), 16) % 2_000_000_000);
}

export function issueKey(email, product = 'signalgen', serial, edition = 2) {
  const day = Math.floor((Date.now() - EPOCH) / 86400000);
  const tag = createHash('sha512').update(String(email).trim().toLowerCase(), 'utf8').digest().subarray(0, 4);
  const payload = Buffer.alloc(13);
  payload[0] = 1; payload[1] = PRODUCTS[product] || 9; payload[2] = edition;
  payload.writeUInt32BE(serial >>> 0, 3); payload.writeUInt16BE(day & 0xffff, 7); tag.copy(payload, 9);
  const sig = edSign(null, Buffer.concat([Buffer.from('SGN1'), payload]), privateKey());
  return 'SGN1-' + (b32(Buffer.concat([payload, sig])).match(/.{1,8}/g) || []).join('-');
}
