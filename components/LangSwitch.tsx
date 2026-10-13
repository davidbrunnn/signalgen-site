'use client';
// PT · ES · EN in the header: remembers the choice in the `lang` cookie (1 year) and re-renders the page in place.
import { useRouter } from 'next/navigation';
import { LANGS, LANG_LABEL, type Lang } from '@/lib/i18n-shared';

export default function LangSwitch({ lang }: { lang: Lang }) {
  const r = useRouter();
  function pick(l: Lang) {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    const u = new URL(window.location.href);
    if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); window.history.replaceState(null, '', u.toString()); }
    r.refresh();
  }
  return (
    <div className="lang" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={l === lang} className={l === lang ? 'on' : ''} onClick={() => pick(l)}>{LANG_LABEL[l]}</button>
      ))}
    </div>
  );
}
