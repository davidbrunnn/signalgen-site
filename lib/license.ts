// SignalGen license keys (SGN1-…), the same format the plugins verify offline (plugins/signalgen-v5/Source/LicenseKey.h):
//   payload (13 bytes) = version 1 · product (1 SignalGen · 2 Mix · 3 Sounds · 9 Bundle) · edition (2 = full) · serial u32 · day u16 since 2026-01-01 · sha512(email)[:4]
//   key = "SGN1-" + base32(payload + Ed25519 signature of "SGN1" + payload), in groups of 8.
// The private seed never lives in the repo: LICENSE_SEED_HEX (env) or, in local mode, the file the Mac keygen uses.
import { createHash, createPrivateKey, sign as edSign, createPublicKey } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { readOrders, LOCAL } from '@/lib/catalog';

const PRODUCTS: Record<string, number> = { signalgen: 1, mix: 2, sounds: 3, bundle: 9 };
const EPOCH = Date.UTC(2026, 0, 1);
const SERIAL_BASE = 100000;   // the Mac keygen counts from 1; the site counts from here so the two ledgers never collide

async function seed(): Promise<Buffer> {
  let hex = process.env.LICENSE_SEED_HEX || '';
  if (!hex && LOCAL) {
    const f = process.env.LICENSE_SEED_FILE || path.join(os.homedir(), 'Desktop', 'SignalGen', 'codigo', 'financeiro', 'licencas', 'private_key.hex');
    hex = (await fs.readFile(f, 'utf8')).trim();
  }
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('LICENSE_SEED_HEX missing or invalid');
  return Buffer.from(hex, 'hex');
}

function privateKeyFromSeed(s: Buffer) {
  const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), s]);   // PKCS#8 wrapper for a raw Ed25519 seed
  return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

export function publicKeyHex(s: Buffer) {
  const spki = createPublicKey(privateKeyFromSeed(s)).export({ format: 'der', type: 'spki' }) as Buffer;
  return spki.subarray(spki.length - 32).toString('hex');
}

function b32(buf: Buffer) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += A[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += A[(val << (5 - bits)) & 31];
  return out;
}

export async function issueKey(email: string, product: keyof typeof PRODUCTS = 'bundle', serial: number, edition = 2) {
  const s = await seed();
  const day = Math.floor((Date.now() - EPOCH) / 86400000);
  const tag = createHash('sha512').update(email.trim().toLowerCase(), 'utf8').digest().subarray(0, 4);
  const payload = Buffer.alloc(13);
  payload[0] = 1; payload[1] = PRODUCTS[product] || 9; payload[2] = edition;
  payload.writeUInt32BE(serial >>> 0, 3); payload.writeUInt16BE(day & 0xffff, 7); tag.copy(payload, 9);
  const sig = edSign(null, Buffer.concat([Buffer.from('SGN1'), payload]), privateKeyFromSeed(s));
  const body = b32(Buffer.concat([payload, sig]));
  return 'SGN1-' + (body.match(/.{1,8}/g) || []).join('-');
}

export async function nextSerial() {
  const orders = await readOrders();
  return SERIAL_BASE + orders.filter((o) => o.serial).length + 1;
}
