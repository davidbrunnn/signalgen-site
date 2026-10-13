import Link from 'next/link';
import { readCatalog, downloadsOf } from '@/lib/catalog';
import { sign } from '@/lib/sign';
import { paidSession, licenseNo } from '@/lib/session';
import { getLang } from '@/lib/i18n';
import { fmt } from '@/lib/region';
import { ui } from '@/lib/i18n-ui';
import { currentEmail } from '@/lib/account';
import CopyKey from '@/components/CopyKey';
import AutoAccount from '@/components/AutoAccount';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'SignalGen · Compra' };

// After payment (Stripe, or the local test checkout). Software: license key + installer. Kits/presets: the zip. Tracks: both WAVs + certificate.
// 10/10/2026: page in the visitor's language (PT default, ES, EN) — it was English only.
const TX = {
  pt: {
    nf: 'Não achamos esta compra.', nfP: 'Se você acabou de pagar, espere alguns segundos e recarregue: a confirmação pode demorar um pouco. O link desta página está no recibo do Stripe. Ainda nada? Responda ao e-mail do recibo e mandamos os seus arquivos.', home: 'Voltar à SignalGen',
    first: 'Alguém levou antes.', firstP: (t: string, a: string) => `Outra pessoa concluiu o pagamento de ${t} um instante antes de você. Licença exclusiva vende uma vez só, então o seu pagamento de ${a} foi reembolsado por inteiro. Aparece na sua fatura em 5 a 10 dias.`, back: 'Voltar',
    test: 'Compra de teste: nenhum valor foi cobrado.', yours: (t: string) => `${t} é seu.`,
    lic: (e: string, m?: boolean) => `Licenciado para ${e}. A chave é pessoal e funciona offline em até dois computadores seus.${m ? ' Ela também foi enviada para o seu e-mail.' : ' Guarde o endereço desta página.'}`,
    issuing: 'Sua chave está sendo emitida: recarregue a página em instantes.',
    s1: 'Baixe e rode o instalador abaixo (macOS 11 ou mais novo, Apple Silicon ou Intel).',
    s2: 'No Ableton Live: Settings → Plug-Ins → ligue Audio Units e VST3 e clique em Rescan.',
    s3m: 'Ponha o Monet numa pista MIDI, clique em ACTIVATE e cole o seu e-mail e esta chave.',
    s3r: (n: string) => `Ponha o ${n} em qualquer canal de áudio, clique em ACTIVATE (no canto de cima), cole o seu e-mail e esta chave.`,
    s3: 'Ponha o SignalGen numa pista MIDI, clique em ACTIVATE (no canto de cima), cole o seu e-mail e esta chave. A mesma chave abre o Monet.',
    other: (n: string, e: string, track: boolean) => `Licença ${n}, emitida para ${e}. ${track ? 'Saiu do catálogo: é só seu. ' : ''}Baixe agora: os links valem por 7 dias e esta página gera novos.`, you: 'você',
    dl: 'Baixar', cert: 'Certificado de licença', certN: 'Para imprimir ou salvar em PDF', open: 'Abrir',
    keep: 'Guarde o endereço desta página e o seu recibo: junto com o certificado, eles são a sua prova de licença. Dúvidas: responda ao e-mail do recibo.',
  },
  es: {
    nf: 'No encontramos esta compra.', nfP: 'Si acabas de pagar, espera unos segundos y recarga: la confirmación puede tardar un poco. El enlace de esta página está en tu recibo de Stripe. ¿Nada todavía? Responde al e-mail del recibo y te enviamos tus archivos.', home: 'Volver a SignalGen',
    first: 'Alguien se lo llevó antes.', firstP: (t: string, a: string) => `Otra persona completó el pago de ${t} un instante antes que tú. La licencia exclusiva se vende una sola vez, así que tu pago de ${a} fue reembolsado por completo. Aparecerá en tu estado de cuenta en 5 a 10 días.`, back: 'Volver',
    test: 'Compra de prueba: no se cobró nada.', yours: (t: string) => `${t} es tuyo.`,
    lic: (e: string, m?: boolean) => `Licenciado a ${e}. La clave es personal y funciona offline en hasta dos de tus computadoras.${m ? ' También fue enviada a tu e-mail.' : ' Guarda la dirección de esta página.'}`,
    issuing: 'Tu clave se está emitiendo: recarga la página en un momento.',
    s1: 'Descarga y ejecuta el instalador de abajo (macOS 11 o más nuevo, Apple Silicon o Intel).',
    s2: 'En Ableton Live: Settings → Plug-Ins → activa Audio Units y VST3 y haz clic en Rescan.',
    s3m: 'Pon Monet en una pista MIDI, haz clic en ACTIVATE y pega tu e-mail y esta clave.',
    s3r: (n: string) => `Pon ${n} en cualquier canal de audio, haz clic en ACTIVATE (arriba), pega tu e-mail y esta clave.`,
    s3: 'Pon SignalGen en una pista MIDI, haz clic en ACTIVATE (arriba), pega tu e-mail y esta clave. La misma clave abre Monet.',
    other: (n: string, e: string, track: boolean) => `Licencia ${n}, emitida a ${e}. ${track ? 'Salió del catálogo: es solo tuyo. ' : ''}Descarga ahora: los enlaces valen 7 días y esta página genera nuevos.`, you: 'ti',
    dl: 'Descargar', cert: 'Certificado de licencia', certN: 'Para imprimir o guardar en PDF', open: 'Abrir',
    keep: 'Guarda la dirección de esta página y tu recibo: junto con el certificado, son tu prueba de licencia. Dudas: responde al e-mail del recibo.',
  },
  en: {
    nf: 'We could not find this purchase.', nfP: 'If you just paid, wait a few seconds and refresh — the payment can take a moment to confirm. The link to this page is in your Stripe receipt. Still nothing? Reply to the receipt email and we will send your files.', home: 'Back to SignalGen',
    first: 'Someone signed it first.', firstP: (t: string, a: string) => `Another buyer completed payment for ${t} a moment before you. Exclusive licenses sell once, so your payment of ${a} has been refunded in full. It will appear on your statement in 5–10 days.`, back: 'Back',
    test: 'Test purchase — no money was charged.', yours: (t: string) => `${t} is yours.`,
    lic: (e: string, m?: boolean) => `Licensed to ${e}. This key is personal and works offline on up to two of your computers.${m ? ' It has also been sent to your email.' : ' Keep this page’s address.'}`,
    issuing: 'Your key is being issued — refresh this page in a moment.',
    s1: 'Download and run the installer below (macOS 11+, Apple Silicon or Intel).',
    s2: 'Ableton Live: Settings → Plug-Ins → turn on Audio Units and VST3, press Rescan.',
    s3m: 'Put Monet on a MIDI track, click Activate and paste your email and this key.',
    s3r: (n: string) => `Put ${n} on any audio channel, click Activate (top right), paste your email and this key.`,
    s3: 'Put SignalGen on a MIDI track, click Activate (top right), paste your email and this key. The same key opens Monet.',
    other: (n: string, e: string, track: boolean) => `License ${n}, issued to ${e}. ${track ? 'It has left the catalog: it is yours alone. ' : ''}Download now — the links stay valid for 7 days and this page can regenerate them.`, you: 'you',
    dl: 'Download', cert: 'License certificate', certN: 'Printable, save as PDF', open: 'Open',
    keep: 'Keep this page’s address and your receipt — together with the certificate they are your proof of license. Questions: reply to the receipt email.',
  },
};

export default async function Thanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const lang = getLang(), U = ui(lang);
  const X = TX[lang as keyof typeof TX] || TX.pt;
  const p = await paidSession(searchParams.session_id);
  const t = p ? (await readCatalog()).tracks.find((x) => x.id === p.trackId) : undefined;
  if (!p || !p.paid || !t) {
    return (
      <main className="wrap narrow">
        <h1>{X.nf}</h1>
        <p className="muted">{X.nfP}</p>
        <Link href="/" className="btn quiet">{X.home}</Link>
      </main>
    );
  }
  if (p.refunded) {
    return (
      <main className="wrap narrow">
        <h1>{X.first}</h1>
        <p className="muted">{X.firstP(t.title, fmt(p.amount, p.currency || 'USD'))}</p>
        <Link href={t.kind === 'vocal' ? '/#packs' : '/ghost'} className="btn">{X.back}</Link>
      </main>
    );
  }
  const sid = p.session, soft = t.kind === 'software';
  const dls = downloadsOf(t).map((d) => ({ ...d, token: sign(t.id, d.key, soft ? 30 : 7) }));
  return (
    <main className="wrap narrow">
      {p.test ? <div className="note warn">{X.test}</div> : null}
      <h1>{X.yours(t.title)}</h1>
      {soft ? (
        <>
          <p className="muted">{X.lic(p.email || '', p.mailed)}</p>
          {p.key ? <CopyKey value={p.key} copy={U.account.copy} copied={U.account.copied} /> : <div className="key" aria-label="License key">{X.issuing}</div>}
          <ol className="steps-mini">
            <li>{X.s1}</li>
            <li>{X.s2}</li>
            <li>{t.id === 'monet' ? X.s3m : t.id === 'refiner' || t.id === 'tempo' ? X.s3r(t.title) : X.s3}</li>
          </ol>
        </>
      ) : (
        <p className="muted">{X.other(licenseNo(sid), p.email || X.you, t.kind === 'track' || t.kind === 'vocal')}</p>
      )}
      <div className="dl">
        {dls.map((d) => <a key={d.key} href={`/api/download?t=${d.token}`}>{d.label} <span>{d.note}</span><i>{X.dl}</i></a>)}
        <Link href={`/license/${sid}`}>{X.cert} <span>{X.certN}</span><i>{X.open}</i></Link>
      </div>
      <div className="note acct-note"><span>{U.thanks.account}</span><Link href="/conta" className="btn small quiet">{U.thanks.toAccount}</Link></div>
      <p className="muted small">{X.keep}</p>
      <AutoAccount session={sid} signedIn={!!currentEmail()} />
    </main>
  );
}
