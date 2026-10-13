// The purchase e-mail (13/10/2026): license key (software) and one button to the purchase page, which serves fresh signed download
// links every time it is opened (so the e-mail never holds an expiring link). Sent by lib/mail (Resend: RESEND_API_KEY + MAIL_FROM).
import { sendMail, layout } from '@/lib/mail';
import { siteUrl } from '@/lib/site';
import type { Track, Order } from '@/lib/catalog';

export async function purchaseMail(t: Track, o: Order) {
  const url = `${siteUrl('https://signalgen-site.vercel.app')}/thanks?session_id=${encodeURIComponent(o.session)}`;
  const soft = t.kind === 'software';
  const free = soft && t.licenseProduct === 'ear';
  const name = t.title + (t.kind === 'preset' ? ' (Serum 2)' : '');
  const lines = soft
    ? [
        free ? `O ${name} é seu, de graça e para sempre.` : `Obrigado pela compra. O ${name} é seu, vitalício.`,
        `Sua chave de licença:\n${o.key || '(abra a página da compra: a chave aparece lá)'}`,
        'Para instalar: baixe o instalador pelo botão abaixo, rode o .pkg, abra o Ableton Live → Settings → Plug-Ins → Rescan. No plugin, clique em ACTIVATE e cole o seu e-mail e esta chave.',
        'A chave funciona offline em até dois computadores seus.',
      ]
    : [
        `Obrigado pela compra. ${name} é seu.`,
        'Baixe pelo botão abaixo. A página gera links novos sempre que você abrir, então pode voltar nela quando quiser.',
        'Licença royalty-free: use em lançamentos, remixes e trabalhos para clientes. Só não pode revender os sons em si.',
      ];
  const { html, text } = layout({
    title: soft ? (free ? `${name}: sua chave` : `${name}: chave e instalador`) : `${name}: seus arquivos`,
    lines, button: soft ? 'Baixar o instalador' : 'Baixar os arquivos', url,
    foot: 'Dúvidas? É só responder este e-mail. Guarde esta mensagem: ela é o seu comprovante de licença.',
  });
  return sendMail({ to: o.email!, subject: soft ? `${name} · sua chave de licença` : `${name} · seus arquivos`, html, text });
}
