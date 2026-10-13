import { redirect } from 'next/navigation';

// The plugin was renamed Clocker (13/10/2026): old links keep working.
export default function Tempo() { redirect('/clocker'); }
