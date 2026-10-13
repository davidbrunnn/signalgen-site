// Prices by country (13/10/2026, David): in Brazil the price in reais; everywhere else THE SAME NUMBER in US dollars
// (R$ 49 in Brazil = US$ 49 abroad). No exchange rate, no local currencies.
// Country: Vercel's x-vercel-ip-country (or Cloudflare's cf-ipcountry). The `?country=XX` override (cookie) only exists in the local
// store: online it would let anyone abroad pick the price in reais.
import { cookies, headers } from 'next/headers';

const ONLINE = !!process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL === '1';
const SYMBOL: Record<string, string> = { BRL: 'R$', USD: 'US$' };
export const ZERO_DECIMAL = new Set(['CLP', 'PYG', 'JPY', 'KRW', 'VND', 'XAF', 'XOF']);

export const SG_PRICE = { founder: Number(process.env.FOUNDER_PRICE_BRL || 199), lifetime: Number(process.env.LIFETIME_PRICE_BRL || 299) };

/** MONET on its own (13/10/2026, David): R$ 99 for the first 10 buyers (launch), then the regular price. Abroad the US$ figure;
 *  in Latin America the Brazilian price in local currency. [launch, regular] */
export const MONET_PRICE = [99, Number(process.env.MONET_REGULAR_BRL || 379)];
export type Money = { amount: number; currency: string; display: string };

export function countryFrom(get: (h: string) => string | null | undefined, cookie?: string | null): string {
  const c = ((ONLINE ? '' : cookie) || get('x-vercel-ip-country') || get('cf-ipcountry') || 'BR').toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : 'BR';
}
/** The visitor's country in a server component / route handler. */
export function country(): string {
  try { const h = headers(); return countryFrom((k) => h.get(k), cookies().get('country')?.value); } catch { return 'BR'; }
}
export function countryOfRequest(req: Request): string {
  const ck = (req.headers.get('cookie') || '').match(/(?:^|;\s*)country=([A-Za-z]{2})/)?.[1];
  return countryFrom((k) => req.headers.get(k), ck);
}

export function fmt(amount: number, currency: string) {
  const dec = Number.isInteger(amount) ? 0 : 2;
  const n = amount.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return `${SYMBOL[currency] || currency} ${n}`;
}

export const sgPrice = (tier: 'founder' | 'lifetime', cc: string) => localized(SG_PRICE[tier], cc);

export const monetPrice = (cc: string, tier: 'founder' | 'lifetime' = 'founder') => { const i = tier === 'founder' ? 0 : 1; return localized(MONET_PRICE[i], cc); };

/** The price of a software item in the visitor's currency, by tier (launch/founder or regular). */
export async function softPrice(t: { licenseProduct?: string; sold?: number }, cc: string, tier: 'founder' | 'lifetime'): Promise<Money> {
  if (t.licenseProduct === 'monet') return monetPrice(cc, tier);
  if (t.licenseProduct === 'refiner') return refinerPrice(cc, tier);
  if (t.licenseProduct === 'ear') return FREE;                      // Tempo: free, in exchange for an e-mail (13/10/2026)
  return sgPrice(tier, cc);
}

/** Stripe's unit_amount for a price in that currency. */
export const minorUnits = (m: Money) => (ZERO_DECIMAL.has(m.currency) ? Math.round(m.amount) : Math.round(m.amount * 100));

// ───── 13/10/2026 (David, plano de lançamento): a escada de preço ─────
// Clocker grátis (e-mail) · Refiner 49 → 99 · Monet 99 → regular · SignalGen (em breve) acompanha só o Monet.
// 13/10/2026 (David): Refiner R$ 49 for the first 10 buyers (launch), R$ 99 after. [launch, regular]
export const REFINER_PRICE = [49, Number(process.env.REFINER_REGULAR_BRL || 99)];
export const SOUND_PRICE_BRL = { pack: Number(process.env.SOUND_PRICE_BRL || 19.9), bundle: Number(process.env.SOUND_BUNDLE_PRICE_BRL || 29.9) };
export const FREE: Money = { amount: 0, currency: 'BRL', display: '' };

/** A price shown to the visitor: reais in Brazil, the same number in US dollars everywhere else. */
export async function localized(amount: number, cc: string): Promise<Money> {
  const currency = cc === 'BR' ? 'BRL' : 'USD';
  return { amount, currency, display: fmt(amount, currency) };
}
export const refinerPrice = (cc: string, tier: 'founder' | 'lifetime' = 'founder') => { const i = tier === 'founder' ? 0 : 1; return localized(REFINER_PRICE[i], cc); };

/** Sample packs, Serum 2 presets and bundles (closed while the packs are "em breve"): the pack's own price, or the default. */
export async function soundPrice(t: { kind?: string; format?: string; price?: number; priceBrl?: number }, cc: string): Promise<Money> {
  return localized(t.priceBrl || (t.kind === 'bundle' ? SOUND_PRICE_BRL.bundle : SOUND_PRICE_BRL.pack), cc);
}

/** Any catalog item in the visitor's currency. Free items come back with amount 0. */
export async function priceFor(t: { kind?: string; format?: string; price?: number; priceBrl?: number; licenseProduct?: string; sold?: number }, cc: string, tier: 'founder' | 'lifetime' = 'founder'): Promise<Money> {
  if (t.kind === 'software') return softPrice(t, cc, tier);
  if (t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle') return soundPrice(t, cc);
  return localized(t.price || 59, 'US');
}

// Ghost production (13/10/2026, David): R$ 1.200 in Brazil, US$ 1,200 abroad — the same number, like everything else.
export const GHOST_PRICE = Number(process.env.GHOST_PRICE || 1200);
export function ghostMoney(cc: string): Money { const currency = cc === 'BR' ? 'BRL' : 'USD'; return { amount: GHOST_PRICE, currency, display: fmt(GHOST_PRICE, currency) }; }
