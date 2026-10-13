'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Saves the producer key in a cookie (30 days) so the desk and the thread API recognise the producer.
export default function AdminKey({ value, silent = false }: { value?: string; silent?: boolean }) {
  const [k, setK] = useState(value || '');
  const r = useRouter();
  const save = (x: string) => { document.cookie = `ghost_admin=${encodeURIComponent(x)}; path=/; max-age=2592000; samesite=lax`; };
  useEffect(() => { if (silent && value) { save(value); const u = new URL(window.location.href); u.searchParams.delete('key'); window.history.replaceState(null, '', u.toString()); } }, [silent, value]);
  if (silent) return null;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(k); r.refresh(); }} className="gform">
      <div className="field"><label htmlFor="ak">Chave do produtor (GHOST_ADMIN_TOKEN)</label><input id="ak" type="password" value={k} onChange={(e) => setK(e.target.value)} /></div>
      <button className="btn">Entrar</button>
    </form>
  );
}
