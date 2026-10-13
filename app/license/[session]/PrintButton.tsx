'use client';
export default function PrintButton() {
  return <button className="btn small quiet" onClick={() => window.print()}>Print or save as PDF</button>;
}
