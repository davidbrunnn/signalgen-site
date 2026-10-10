// The license e-mail (Resend HTTP API). Env: RESEND_API_KEY, MAIL_FROM ("SignalGen <licenca@your-domain>"), MAIL_REPLY_TO, INSTALLER_URL.
// Without RESEND_API_KEY it only logs (the key is still on the thank-you page and in the PaymentIntent metadata).
export async function mailLicense(to, product, key) {
  const api = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM;
  if (!api || !from || !to) { console.warn('license e-mail not configured'); return { ok: false }; }
  const dl = process.env.INSTALLER_URL || '';
  const text = `Your ${product} license\n\n1. Download and install: ${dl}\n2. Rescan plug-ins in your DAW.\n3. Open SignalGen > ACTIVATE: this purchase e-mail + the key:\n\n${key}\n\nThe key works with this e-mail. 7-day refund: just reply to this e-mail.\n\n---\nSua licença ${product}: instale (${dl}), faça o Rescan na DAW e em ACTIVATE cole este e-mail e a chave acima. Garantia de 7 dias: responda este e-mail.`;
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-weight:700;max-width:520px;color:#0b0d10"><h1 style="font-size:26px">Your ${product} license</h1>
<p style="font-weight:500;line-height:1.5">1. Download and install: <a href="${dl}">${dl}</a><br>2. Rescan plug-ins in your DAW.<br>3. Open SignalGen &rarr; ACTIVATE: this purchase e-mail + the key below.</p>
<pre style="background:#eef3f8;padding:16px;border-radius:12px;white-space:pre-wrap;word-break:break-all">${key}</pre>
<p style="font-weight:500;color:#555">The key works with this e-mail. 7-day refund: reply to this e-mail.<br>Sua licença: instale, faça o Rescan e cole este e-mail e a chave em ACTIVATE. Garantia de 7 dias: responda este e-mail.</p></div>`;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${api}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `Your ${product} license key`, text, html, reply_to: process.env.MAIL_REPLY_TO || undefined }) });
  if (!r.ok) throw new Error(`license e-mail failed: ${r.status}`);
  return { ok: true };
}
