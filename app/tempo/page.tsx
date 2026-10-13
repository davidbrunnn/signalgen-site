import Link from 'next/link';
import type { Metadata } from 'next';
import { readCatalog } from '@/lib/catalog';
import { country, sgPrice, refinerPrice } from '@/lib/region';
import FreeForm from '@/components/FreeForm';
import { getLang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// TEMPO, free (13/10/2026, David): the door of the shop. An e-mail in, the license key and the installer out (/api/free).
const TX = {
  pt: {
    title: 'Tempo · BPM e tom em 10 segundos · grátis · SignalGen', desc: 'BPM, tom e acordes de qualquer coisa que estiver tocando. Plugin grátis para Ableton Live.',
    eyebrow: 'Tempo · AU + VST3 · macOS · grátis', h1a: 'BPM e tom de qualquer coisa,', h1b: 'em 10 segundos.', lede: 'Ponha o Tempo em qualquer canal (ou no master, ouvindo a Mix), aperte LISTEN e dez segundos depois você tem o BPM, o tom e os acordes do que estiver tocando. Solte um arquivo em cima e ele lê o arquivo. Grátis: deixe o seu e-mail e a chave é sua, vitalícia.',
    ph: 'seu@email.com', cta: 'Quero o Tempo grátis', err: 'Não deu. Confira o e-mail e tente de novo.', fine: 'Você recebe a chave na próxima página e por e-mail. Mandamos novidades da SignalGen de vez em quando; sai quando quiser.',
    trust: [['10 s', 'para o BPM e o tom'], ['Mix', 'ouve o canal ou a mix inteira'], ['R$ 0', 'vitalício, offline']],
    whatH: 'O que ele lê', what: [['BPM', 'Com desempate pelo tempo do set', 'Se o resultado for 4/3, 3/2 ou o dobro do BPM do set, o Tempo mostra a leitura que casa com a sua sessão.'], ['TOM', 'Tom e acordes', 'Perfis de tonalidade e progressão de acordes do trecho ouvido; publicado para os outros plugins da SignalGen.'], ['ARQUIVO', 'Solte um .wav ou .mp3', 'Lê o arquivo inteiro em vez do canal: bom para conferir uma referência antes de puxar para o set.']],
    nextH: 'Quando quiser mais', nextP: 'O Tempo é a porta. Dentro da casa:', ref: 'Refiner · EQ de 24 bandas', sg: 'SignalGen · a faixa inteira, com tudo incluso',
    trademark: 'Ableton e Live são marcas da Ableton AG. A SignalGen não é afiliada à Ableton.',
  },
  es: {
    title: 'Tempo · BPM y tono en 10 segundos · gratis · SignalGen', desc: 'BPM, tono y acordes de lo que esté sonando. Plugin gratis para Ableton Live.',
    eyebrow: 'Tempo · AU + VST3 · macOS · gratis', h1a: 'BPM y tono de cualquier cosa,', h1b: 'en 10 segundos.', lede: 'Pon Tempo en cualquier canal (o en el master, escuchando la Mix), pulsa LISTEN y diez segundos después tienes el BPM, el tono y los acordes. Suelta un archivo encima y lo lee. Gratis: deja tu e-mail y la clave es tuya, de por vida.',
    ph: 'tu@email.com', cta: 'Quiero Tempo gratis', err: 'No funcionó. Revisa el e-mail e inténtalo de nuevo.', fine: 'Recibes la clave en la próxima página y por e-mail. Enviamos novedades de SignalGen de vez en cuando; te sales cuando quieras.',
    trust: [['10 s', 'para el BPM y el tono'], ['Mix', 'escucha el canal o toda la mix'], ['$ 0', 'de por vida, offline']],
    whatH: 'Qué lee', what: [['BPM', 'Con desempate por el tempo del set', 'Si el resultado es 4/3, 3/2 o el doble del BPM del set, Tempo muestra la lectura que encaja con tu sesión.'], ['TONO', 'Tono y acordes', 'Perfiles de tonalidad y progresión de acordes del fragmento escuchado.'], ['ARCHIVO', 'Suelta un .wav o .mp3', 'Lee el archivo entero en vez del canal.']],
    nextH: 'Cuando quieras más', nextP: 'Tempo es la puerta. Dentro de la casa:', ref: 'Refiner · EQ de 24 bandas', sg: 'SignalGen · el tema entero, con todo incluido',
    trademark: 'Ableton y Live son marcas de Ableton AG. SignalGen no está afiliada a Ableton.',
  },
  en: {
    title: 'Tempo · BPM and key in 10 seconds · free · SignalGen', desc: 'BPM, key and chords of whatever is playing. Free plugin for Ableton Live.',
    eyebrow: 'Tempo · AU + VST3 · macOS · free', h1a: 'BPM and key of anything,', h1b: 'in 10 seconds.', lede: 'Put Tempo on any channel (or on the master, listening to the Mix), press LISTEN and ten seconds later you have the BPM, the key and the chords of whatever is playing. Drop a file on it and it reads the file. Free: leave your e-mail and the key is yours, for life.',
    ph: 'you@email.com', cta: 'Get Tempo free', err: 'That didn’t work. Check the e-mail and try again.', fine: 'You get the key on the next page and by e-mail. We send SignalGen news now and then; leave whenever you like.',
    trust: [['10 s', 'to BPM and key'], ['Mix', 'listens to the channel or the whole mix'], ['$ 0', 'lifetime, offline']],
    whatH: 'What it reads', what: [['BPM', 'Tie-break by the set’s tempo', 'If the result is 4/3, 3/2 or twice the set’s BPM, Tempo shows the reading that fits your session.'], ['KEY', 'Key and chords', 'Key profiles and the chord progression of what it heard; published to the other SignalGen plugins.'], ['FILE', 'Drop a .wav or .mp3', 'Reads the whole file instead of the channel.']],
    nextH: 'When you want more', nextP: 'Tempo is the door. Inside:', ref: 'Refiner · 24-band EQ', sg: 'SignalGen · the whole track, everything included',
    trademark: 'Ableton and Live are trademarks of Ableton AG. SignalGen is not affiliated with Ableton.',
  },
};

export function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Metadata {
  const X = TX[getLang(searchParams) as keyof typeof TX] || TX.pt;
  return { title: X.title, description: X.desc };
}

export default async function TempoPage({ searchParams }: { searchParams: { lang?: string } }) {
  const X = TX[getLang(searchParams) as keyof typeof TX] || TX.pt;
  const cat = await readCatalog();
  const it = cat.tracks.find((x) => x.id === 'tempo');
  const cc = country();
  const [sgp, rp] = await Promise.all([sgPrice('founder', cc), refinerPrice(cc)]);
  return (
    <main className="wrap">
      <section className="phero" aria-label="Tempo">
        <div className="phero-copy">
          <span className="eyebrow">{X.eyebrow}</span>
          <h1>{X.h1a} <em className="muted">{X.h1b}</em></h1>
          <p className="lede">{X.lede}</p>
          {it ? <FreeForm id={it.id} placeholder={X.ph} cta={X.cta} err={X.err} /> : null}
          <p className="muted small" style={{ marginTop: 'var(--s2)' }}>{X.fine}</p>
          <ul className="trust">{X.trust.map(([b, s]) => <li key={b + s}><b>{b}</b>{s}</li>)}</ul>
        </div>
        <figure className="phero-shot monet-shot"><img src="/product/ui2/tempo_01.png" alt="Tempo" /></figure>
      </section>
      <section className="block" id="inside">
        <header><h2>{X.whatH}</h2><p /></header>
        <div className="g-get monet-what">{X.what.map(([tag, h, p]) => <div key={tag}><span className="eyebrow">{tag}</span><b>{h}</b><p>{p}</p></div>)}</div>
      </section>
      <section className="block" id="next">
        <header><h2>{X.nextH}</h2><p>{X.nextP}</p></header>
        <div className="act">
          <Link href="/refiner" className="btn quiet">{X.ref} · {rp.display}</Link>
          <Link href="/signalgen" className="btn">{X.sg} · {sgp.display}</Link>
        </div>
        <p className="muted small" style={{ marginTop: 'var(--s4)' }}>{X.trademark}</p>
      </section>
    </main>
  );
}
