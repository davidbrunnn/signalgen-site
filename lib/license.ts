// SignalGen license keys (SGN1-…), the same format the plugins verify offline (plugins/signalgen-v5/Source/LicenseKey.h):
//   payload (13 bytes) = version 1 · product (1 SignalGen · 2 Mix · 3 Sounds · 4 Refiner · 5 Monet · 6 Ear · 9 Bundle) · edition (2 = full) · serial u32 · day u16 since 2026-01-01 · sha512(email)[:4]
//   key = "SGN1-" + base32(payload + Ed25519 signature of "SGN1" + payload), in groups of 8.
// The private seed never lives in the repo: LICENSE_SEED_HEX (env) or, in local mode, the file the Mac keygen uses.
import { createHash, createHmac, createPrivateKey, sign as edSign, verify as edVerify, createPublicKey } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { readOrders, LOCAL } from '@/lib/catalog';

const PRODUCTS: Record<string, number> = { signalgen: 1, mix: 2, sounds: 3, refiner: 4, monet: 5, ear: 6, bundle: 9 };
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
  // online the listing carries no order body, so every order counts (serials only need to be unique and growing)
  return SERIAL_BASE + (LOCAL ? orders.filter((o) => o.serial).length : orders.length) + 1;
}

// ───────────────────────────────────────────────────────────────── online activation (13/10/2026, David: "ativação somente online")
// The plugin sends the key, the buyer's e-mail and a fingerprint of the computer; if the key is ours, not cancelled and has a seat
// free (two computers per key), the answer is an activation the plugin verifies offline (plugins/signalgen-v5/Source/LicenseKey.h):
//   "SGA1-" + base32( payload(18) + Ed25519 signature of "SGA1" + payload )
//   payload = version 1 · the key's product · the key's serial u32 · device tag (8 bytes) · issued day u16 · last valid day u16
export const SEATS = 2;
export const ACTIVATION_DAYS = 90;
const BUNDLE = 9, EAR = 6, CLOCKER = 8;

function unb32(text: string): Buffer | null {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let acc = 0, bits = 0; const out: number[] = [];
  for (const ch of text.toUpperCase()) {
    if (ch === '-' || ch === '=' || /\s/.test(ch)) continue;
    const v = A.indexOf(ch); if (v < 0) return null;
    acc = ((acc << 5) | v) & 0xfff; bits += 5;
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff); }
  }
  return Buffer.from(out);
}

export type KeyInfo = { product: number; edition: number; serial: number; day: number };
/** Reads an SGN1 key and checks it is ours (signature) and belongs to that e-mail. Null when it is not. */
export async function readKey(key: string, email: string): Promise<KeyInfo | null> {
  const k = String(key || '').trim();
  if (!/^SGN1/i.test(k)) return null;
  const raw = unb32(k.slice(4));
  if (!raw || raw.length < 77) return null;
  const payload = raw.subarray(0, 13), sig = raw.subarray(13, 77);
  if (payload[0] !== 1) return null;
  const pub = createPublicKey(privateKeyFromSeed(await seed()));
  if (!edVerify(null, Buffer.concat([Buffer.from('SGN1'), payload]), pub, sig)) return null;
  const tag = createHash('sha512').update(String(email || '').trim().toLowerCase(), 'utf8').digest().subarray(0, 4);
  if (!tag.equals(payload.subarray(9, 13))) return null;
  return { product: payload[1], edition: payload[2], serial: payload.readUInt32BE(3), day: payload.readUInt16BE(7) };
}
/** The serial inside a key, without checking anything (the account page lists the computers of the buyer's own keys). */
export function serialOf(key?: string): number | null {
  const raw = key && /^SGN1/i.test(key.trim()) ? unb32(key.trim().slice(4)) : null;
  return raw && raw.length >= 13 && raw[0] === 1 ? raw.readUInt32BE(3) : null;
}

export type Seat = { tag: string; name?: string; os?: string; first: string; last: string };
export type Seats = { serial: number; product: number; devices: Seat[]; revoked?: boolean };
const seatsKey = (serial: number) => `studio/lic/${createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN || 'local').update(`lic|${serial}`).digest('hex').slice(0, 32)}.json`;
const seatsFile = () => path.join(process.cwd(), 'local-data', 'seats.json');

export async function readSeats(serial: number): Promise<Seats | null> {
  if (LOCAL) { try { return (JSON.parse(await fs.readFile(seatsFile(), 'utf8')) as Record<string, Seats>)[String(serial)] || null; } catch { return null; } }
  const { readBlobJson } = await import('@/lib/store');
  return readBlobJson<Seats>(seatsKey(serial), true);
}
export async function writeSeats(s: Seats) {
  if (LOCAL) {
    let all: Record<string, Seats> = {}; try { all = JSON.parse(await fs.readFile(seatsFile(), 'utf8')); } catch { /* first */ }
    all[String(s.serial)] = s; await fs.mkdir(path.dirname(seatsFile()), { recursive: true }); await fs.writeFile(seatsFile(), JSON.stringify(all)); return;
  }
  const { writeBlobJson } = await import('@/lib/store');
  await writeBlobJson(seatsKey(s.serial), s);
}
const revokedList = () => new Set((process.env.LICENSE_REVOKED || '').split(',').map((x) => Number(x.trim())).filter((x) => x > 0));

export type Activation = { ok: true; token: string; seats: number } | { ok: false; error: 'invalid' | 'product' | 'revoked' | 'seats' | 'device'; message: string };

/** One activation request from a plugin. `product` is the plugin asking (its SG_LICENSE_PRODUCT), `device` 16 hex digits. */
export async function activate(req: { key: string; email: string; product: number; device: string; name?: string; os?: string }): Promise<Activation> {
  const device = String(req.device || '').toLowerCase();
  if (!/^[0-9a-f]{16}$/.test(device)) return { ok: false, error: 'device', message: 'This plugin could not identify the computer. Update the plugin and try again.' };
  const info = await readKey(req.key, req.email);
  if (!info) return { ok: false, error: 'invalid', message: 'This key and email do not match a SignalGen license. Use the email of the purchase and copy the whole key.' };
  const p = Number(req.product) || 0;
  if (!(info.product === p || info.product === BUNDLE || (p === CLOCKER && info.product === EAR))) return { ok: false, error: 'product', message: 'This key belongs to another SignalGen plugin.' };
  const rec: Seats = (await readSeats(info.serial)) || { serial: info.serial, product: info.product, devices: [] };
  if (rec.revoked || revokedList().has(info.serial)) return { ok: false, error: 'revoked', message: 'This key was cancelled (refund or leak). Contact support at signalgen-site.vercel.app/suporte.' };
  const now = new Date().toISOString(), clean = (x?: string) => String(x || '').replace(/[^\x20-\x7e]/g, '').slice(0, 60);
  const mine = rec.devices.find((d) => d.tag === device);
  if (mine) { mine.last = now; if (req.name) mine.name = clean(req.name); if (req.os) mine.os = clean(req.os); }
  else {
    if (rec.devices.length >= SEATS) {
      const names = rec.devices.map((d) => d.name || 'a computer').join(' and ');
      return { ok: false, error: 'seats', message: `This key is already active on ${SEATS} computers (${names}). Free one in your account (signalgen-site.vercel.app/conta) and try again.` };
    }
    rec.devices.push({ tag: device, name: clean(req.name), os: clean(req.os), first: now, last: now });
  }
  await writeSeats(rec);
  const day = Math.floor((Date.now() - EPOCH) / 86400000);
  const payload = Buffer.alloc(18);
  payload[0] = 1; payload[1] = info.product; payload.writeUInt32BE(info.serial >>> 0, 2); Buffer.from(device, 'hex').copy(payload, 6);
  payload.writeUInt16BE(day & 0xffff, 14); payload.writeUInt16BE((day + ACTIVATION_DAYS) & 0xffff, 16);
  const sig = edSign(null, Buffer.concat([Buffer.from('SGA1'), payload]), privateKeyFromSeed(await seed()));
  const body = b32(Buffer.concat([payload, sig]));
  return { ok: true, token: 'SGA1-' + (body.match(/.{1,8}/g) || []).join('-'), seats: rec.devices.length };
}

/** Frees one computer of a key (the buyer, from the account page). */
export async function releaseSeat(serial: number, tag: string) {
  const rec = await readSeats(serial); if (!rec) return false;
  const n = rec.devices.length; rec.devices = rec.devices.filter((d) => d.tag !== tag);
  if (rec.devices.length === n) return false;
  await writeSeats(rec); return true;
}
