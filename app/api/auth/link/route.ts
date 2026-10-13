// Way in nº 1: a sign-in link sent to the e-mail (valid 30 min). The answer is the same whether or not the address has purchases.
import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/site';
import { cleanEmail, isEmail, token, tooMany } from '@/lib/account';
import { sendMail, layout } from '@/lib/mail';
import { LOCAL } from '@/lib/catalog';

export const runtime = 'nodejs';

const TX = {
  pt: { subject: 'Seu link de acesso · SignalGen', title: 'Entrar na sua conta', lines: ['Clique no botão para abrir a sua conta SignalGen: seus plugins, chaves de licença e downloads ficam lá.', 'O link vale por 30 minutos e só funciona uma vez por pedido. Se não foi você, ignore este e-mail.'], button: 'Abrir minha conta', foot: 'SignalGen' },
  es: { subject: 'Tu enlace de acceso · SignalGen', title: 'Entrar en tu cuenta', lines: ['Haz clic en el botón para abrir tu cuenta SignalGen: tus plugins, claves de licencia y descargas están ahí.', 'El enlace vale 30 minutos. Si no fuiste tú, ignora este e-mail.'], button: 'Abrir mi cuenta', foot: 'SignalGen' },
  en: { subject: 'Your sign-in link · SignalGen', title: 'Sign in to your account', lines: ['Click the button to open your SignalGen account: your plugins, license keys and downloads live there.', 'The link is valid for 30 minutes. If this wasn’t you, ignore this e-mail.'], button: 'Open my account', foot: 'SignalGen' },
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  if (!isEmail(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  if (tooMany(`link|${email}`, 4)) return NextResponse.json({ error: 'slow' }, { status: 429 });
  const X = TX[(body.lang as keyof typeof TX)] || TX.pt;
  const url = `${siteUrl(new URL(req.url).origin)}/api/auth/verify?t=${token('login', email, 30 * 60)}`;
  const m = layout({ title: X.title, lines: X.lines, button: X.button, url, foot: X.foot });
  const sent = await sendMail({ to: email, subject: X.subject, ...m });
  // the local store has no mail server: the link comes back so the flow can be walked
  if (sent === 'outbox' && LOCAL) return NextResponse.json({ ok: true, dev: url });
  if (sent !== 'sent') return NextResponse.json({ error: 'mail' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
