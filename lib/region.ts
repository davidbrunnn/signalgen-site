// SignalGen's price by country (10/10/2026, David): R$ 199 in Brazil (founder; R$ 299 lifetime after the first 100), US$ 49 / US$ 74
// outside Brazil, and in Latin America the local currency worth the same as the Brazilian price (R$ → local by today's rate, rounded
// to a clean price: 2 significant digits, ending in 9 — R$ 199 ≈ MX$ 709, ARS $ 59.999, CLP $ 38.999, S/ 139…).
// Country: Vercel's x-vercel-ip-country (or Cloudflare's cf-ipcountry); `?country=MX` on any page sets a cookie (testing, or a buyer
// abroad with a Brazilian card can switch). Without either (the local store), Brazil.
import { cookies, headers } from 'next/headers';

export const LATAM: Record<string, string> = {
  AR: 'ARS', BO: 'BOB', CL: 'CLP', CO: 'COP', CR: 'CRC', DO: 'DOP', EC: 'USD', GT: 'GTQ', HN: 'HNL', MX: 'MXN', NI: 'NIO',
  PA: 'USD', PE: 'PEN', PY: 'PYG', SV: 'USD', UY: 'UYU', VE: 'USD',
};
const SYMBOL: Record<string, string> = { BRL: 'R$', USD: 'US$', MXN: 'MX$', ARS: 'ARS $', CLP: 'CLP $', COP: 'COP $', PEN: 'S/', UYU: '$U', PYG: '₲',
  BOB: 'Bs', CRC: '₡', DOP: 'RD$', GTQ: 'Q', HNL: 'L', NIO: 'C$' };
export const ZERO_DECIMAL = new Set(['CLP', 'PYG', 'JPY', 'KRW', 'VND', 'XAF', 'XOF']);
// fallback when the rate service can't be reached (open.er-api.com, 09/10/2026): 1 BRL =
const FALLBACK: Record<string, number> = { USD: 0.1993, MXN: 3.584, ARS: 302.6, CLP: 194.7, COP: 645.3, PEN: 0.686, UYU: 7.981, PYG: 1159,
  BOB: 2.379, CRC: 90.76, DOP: 12.05, GTQ: 1.521, HNL: 5.343, NIO: 7.326 };

export const SG_PRICE = {
  BRL: { founder: Number(process.env.FOUNDER_PRICE_BRL || 199), lifetime: Number(process.env.LIFETIME_PRICE_BRL || 299) },
  USD: { founder: Number(process.env.FOUNDER_PRICE_USD || 49), lifetime: Number(process.env.LIFETIME_PRICE_USD || 74) },
};

/** MONET sold on its own (10/10/2026, David: "venda ele separado no marketplace por 30% do preço do Serum 2 verdadeiro"): Serum 2 is
 *  US$ 249 (Xfer Records), so US$ 74.70 abroad; in Brazil R$ 379 (30 % of Serum 2 in reais, rounded to a clean price), and the
 *  Brazilian price in local currency in Latin America, like the SignalGen. Free inside every SignalGen license. */
export const SERUM2_USD = 249;
export const MONET_PRICE = { BRL: Number(process.env.MONET_PRICE_BRL || 379), USD: Number(process.env.MONET_PRICE_USD || 74.7) };

export type Money = { amount: number; currency: string; display: string };

export function countryFrom(get: (h: string) => string | null | undefined, cookie?: string | null): string {
  const c = (cookie || get('x-vercel-ip-country') || get('cf-ipcountry') || 'BR').toUpperCase();
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

let cache: { at: number; r: Record<string, number> } | null = null;
async function rates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < 12 * 3600e3) return cache.r;
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/BRL', { next: { revalidate: 43200 } } as RequestInit);
    const j = await r.json();
    if (j?.rates?.USD) { cache = { at: Date.now(), r: j.rates }; return j.rates; }
  } catch { /* offline */ }
  return FALLBACK;
}

/** 2 significant digits, then one unit less: 713 → 709, 60 214 → 59 999, 39.6 → 39. */
export function nice(v: number) {
  if (v < 10) return Math.round(v);
  const d = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / d) * d - 1;
}

export function fmt(amount: number, currency: string) {
  const dec = Number.isInteger(amount) ? 0 : 2;
  const n = amount.toLocaleString(currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'es-419', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return `${SYMBOL[currency] || currency} ${n}`;
}

export async function sgPrice(tier: 'founder' | 'lifetime', cc: string): Promise<Money> {
  if (cc === 'BR') { const a = SG_PRICE.BRL[tier]; return { amount: a, currency: 'BRL', display: fmt(a, 'BRL') }; }
  const cur = LATAM[cc];
  if (cur) {
    const r = await rates(); const rate = r[cur] || FALLBACK[cur];
    if (rate) { const a = nice(SG_PRICE.BRL[tier] * rate); return { amount: a, currency: cur, display: fmt(a, cur) }; }
  }
  const a = SG_PRICE.USD[tier]; return { amount: a, currency: 'USD', display: fmt(a, 'USD') };
}

export async function monetPrice(cc: string): Promise<Money> {
  if (cc === 'BR') return { amount: MONET_PRICE.BRL, currency: 'BRL', display: fmt(MONET_PRICE.BRL, 'BRL') };
  const cur = LATAM[cc];
  if (cur) {
    const r = await rates(); const rate = r[cur] || FALLBACK[cur];
    if (rate) { const a = nice(MONET_PRICE.BRL * rate); return { amount: a, currency: cur, display: fmt(a, cur) }; }
  }
  return { amount: MONET_PRICE.USD, currency: 'USD', display: fmt(MONET_PRICE.USD, 'USD') };
}

/** The price of a software item in the visitor's currency: the SignalGen by tier, the Monet at 30 % of Serum 2. */
export async function softPrice(t: { licenseProduct?: string; sold?: number }, cc: string, tier: 'founder' | 'lifetime'): Promise<Money> {
  if (t.licenseProduct === 'monet') return monetPrice(cc);
  if (t.licenseProduct === 'refiner') return refinerPrice(cc);
  if (t.licenseProduct === 'ear') return FREE;                      // Tempo: free, in exchange for an e-mail (13/10/2026)
  return sgPrice(tier, cc);
}

/** Stripe's unit_amount for a price in that currency. */
export const minorUnits = (m: Money) => (ZERO_DECIMAL.has(m.currency) ? Math.round(m.amount) : Math.round(m.amount * 100));

// ───── 13/10/2026 (David, plano de lançamento): a escada de preço ─────
// Tempo grátis (e-mail) · packs e presets R$ 19,90 no Brasil (US$ do kit_loja fora) · Refiner R$ 49,90 / US$ 12,90 · SignalGen fundador
// R$ 199 (Refiner + Monet + Tempo inclusos). Na América Latina, o preço brasileiro na moeda local, como o SignalGen.
export const REFINER_PRICE = { BRL: Number(process.env.REFINER_PRICE_BRL || 49.9), USD: Number(process.env.REFINER_PRICE_USD || 12.9) };
export const SOUND_PRICE_BRL = { pack: Number(process.env.SOUND_PRICE_BRL || 19.9), bundle: Number(process.env.SOUND_BUNDLE_PRICE_BRL || 29.9) };
export const FREE: Money = { amount: 0, currency: 'BRL', display: '' };

/** A Brazilian price shown to the visitor: BRL in Brazil, local currency in Latin America (by today's rate), the US$ figure elsewhere. */
export async function localized(brl: number, usd: number, cc: string): Promise<Money> {
  if (cc === 'BR') return { amount: brl, currency: 'BRL', display: fmt(brl, 'BRL') };
  const cur = LATAM[cc];
  if (cur) {
    const r = await rates(); const rate = r[cur] || FALLBACK[cur];
    if (rate) { const a = nice(brl * rate); return { amount: a, currency: cur, display: fmt(a, cur) }; }
  }
  return { amount: usd, currency: 'USD', display: fmt(usd, 'USD') };
}
export const refinerPrice = (cc: string) => localized(REFINER_PRICE.BRL, REFINER_PRICE.USD, cc);

/** Sample packs, Serum 2 presets and bundles: R$ 19,90 / R$ 29,90 in Brazil, that in local currency in Latin America, kit_loja's US$ elsewhere. */
export async function soundPrice(t: { kind?: string; format?: string; price?: number }, cc: string): Promise<Money> {
  const usd = t.price || 12;
  if (t.format === 'collection') return cc === 'BR' || LATAM[cc] ? localized(nice(usd * 5), usd, cc) : { amount: usd, currency: 'USD', display: fmt(usd, 'USD') };
  return localized(t.kind === 'bundle' ? SOUND_PRICE_BRL.bundle : SOUND_PRICE_BRL.pack, usd, cc);
}

/** Any catalog item in the visitor's currency. Free items come back with amount 0. */
export async function priceFor(t: { kind?: string; format?: string; price?: number; licenseProduct?: string; sold?: number }, cc: string, tier: 'founder' | 'lifetime' = 'founder'): Promise<Money> {
  if (t.kind === 'software') return softPrice(t, cc, tier);
  if (t.kind === 'kit' || t.kind === 'preset' || t.kind === 'bundle') return soundPrice(t, cc);
  const usd = t.price || 59; return { amount: usd, currency: 'USD', display: fmt(usd, 'USD') };
}
