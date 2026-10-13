// Customer support (13/10/2026): the message is e-mailed to the shop's inbox (reply-to = the customer) and kept in Blob
// (studio/support/, random name). If the e-mail cannot be sent, the answer carries a ready mailto so the customer still reaches us.
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { randomBytes } from 'crypto';
import { sendMail, layout } from '@/lib/mail';
import { PRODUCER_EMAIL } from '@/lib/ghost';
import { LOCAL } from '@/lib/catalog';
import { cleanEmail, isEmail, tooMany, currentEmail } from '@/lib/account';

export const runtime = 'nodejs';
const clean = (s: unknown, n: number) => String(s ?? '').replace(/\r/g, '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = cleanEmail(b.email), message = clean(b.message, 4000);
  if (!isEmail(email) || message.length < 5) return NextResponse.json({ error: 'fields' }, { status: 400 });
  if (tooMany(`support|${email}`, 5)) return NextResponse.json({ error: 'slow' }, { status: 429 });
  const name = clean(b.name, 80).replace(/\n/g, ' '), topic = clean(b.topic, 60).replace(/\n/g, ' ') || 'Suporte', page = clean(b.page, 120).replace(/\n/g, ' ');
  const id = `s${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;
  const signedIn = currentEmail();
  const record = { id, when: new Date().toISOString(), name, email, topic, message, page, lang: clean(b.lang, 2), account: signedIn || undefined };
  if (!LOCAL) { try { await put(`studio/support/${id}.json`, JSON.stringify(record), { access: 'public', addRandomSuffix: true, contentType: 'application/json' }); } catch (e) { console.error('support store', e); } }
  const m = layout({
    title: `Suporte: ${topic}`,
    lines: [`${name || '(sem nome)'} <${email}>${signedIn ? ` · conta: ${signedIn}` : ''}`, message, page ? `Página: ${page}` : ''].filter(Boolean),
    foot: `SignalGen · suporte · ${id} — responda este e-mail para falar com o cliente.`,
  });
  const sent = await sendMail({ to: PRODUCER_EMAIL, subject: `[Suporte] ${topic} · ${name || email}`, ...m, replyTo: email });
  if (sent === 'sent' || (sent === 'outbox' && LOCAL)) return NextResponse.json({ ok: true });
  const mailto = `mailto:${PRODUCER_EMAIL}?subject=${encodeURIComponent(`[Suporte SignalGen] ${topic}`)}&body=${encodeURIComponent(`${message}\n\n${name}\n${email}`)}`;
  return NextResponse.json({ ok: false, mailto }, { status: 503 });
}
