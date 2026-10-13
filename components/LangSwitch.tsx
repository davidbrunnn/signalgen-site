'use client';
// PT · ES · EN in the header: remembers the choice in the `lang` cookie (1 year) and re-renders the page in place.
// 13/10/2026: the button answers at the click (it used to stay on the old language until the server came back, so the click
// looked dead) and a second click while the page is still arriving is ignored.
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANGS, LANG_LABEL, type Lang } from '@/lib/i18n-shared';

export default function LangSwitch({ lang }: { lang: Lang }) {
  const r = useRouter();
  const [picked, setPicked] = useState<Lang>(lang);
  const [pending, start] = useTransition();
  useEffect(() => { setPicked(lang); }, [lang]);
  function pick(l: Lang) {
    if (l === picked) return;
    setPicked(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    const u = new URL(window.location.href);
    if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); window.history.replaceState(null, '', u.toString()); }
    start(() => r.refresh());
  }
  return (
    <div className="lang" role="group" aria-label="Language" aria-busy={pending} data-busy={pending ? '1' : '0'}>
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={l === picked} className={l === picked ? 'on' : ''} onClick={() => pick(l)}>{LANG_LABEL[l]}</button>
      ))}
    </div>
  );
}
