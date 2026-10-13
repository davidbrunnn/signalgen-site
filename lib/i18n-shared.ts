// The parts of lib/i18n that the browser may import (no next/headers).
export const LANGS = ['pt', 'es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { pt: 'PT', es: 'ES', en: 'EN' };
export const HTML_LANG: Record<Lang, string> = { pt: 'pt-BR', es: 'es', en: 'en' };
export function isLang(x: unknown): x is Lang { return typeof x === 'string' && (LANGS as readonly string[]).includes(x); }
