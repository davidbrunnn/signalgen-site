'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** the key, with a copy button */
export function KeyBox({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="keybox">
      <code>{value}</code>
      <button type="button" className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }); }}>
        {done ? 'Copied' : 'Copy key'}
      </button>
    </div>
  );
}

/** while a Pix is still being paid: ask the server again every few seconds */
export function Waiting() {
  const router = useRouter();
  useEffect(() => { const t = setInterval(() => router.refresh(), 4000); return () => clearInterval(t); }, [router]);
  return null;
}
