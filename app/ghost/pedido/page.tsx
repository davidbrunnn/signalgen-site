import Link from 'next/link';
import type { Metadata } from 'next';
import { getLang, t } from '@/lib/i18n';
import GhostForm from './GhostForm';

export const dynamic = 'force-dynamic';
export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata { return { title: t(getLang(searchParams)).form.metaTitle }; }

export default function Pedido({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams), L = t(lang);
  return (
    <main className="wrap narrow">
      <Link href="/ghost" className="back">{L.ghost.eyebrow}</Link>
      <h1>{L.form.h1}</h1>
      <p className="muted">{L.form.lede}</p>
      <GhostForm lang={lang} F={L.form} />
    </main>
  );
}
