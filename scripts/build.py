#!/usr/bin/env python3
"""build.py — writes index.html (the marketplace) from scripts/venda.json.

The marketplace shows exactly the packs in ~/Desktop/samples/Venda on the Mac, nothing else.
On the Mac: python3 ~/Desktop/SignalGen/codigo/loja-venda/exporta.py  -> out/ (venda.json, covers, previews)
Here:       copy out/<id>/ into packs/, out/venda.json into scripts/, run this, commit, push (GitHub Pages serves it).
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(ROOT, 'scripts', 'venda.json')))
E = html.escape
# Stripe backend (the pay/ Vercel project). Empty = checkout not live yet, buttons show "soon".
PAY = (os.environ.get('PAY_URL') or data.get('pay_url') or '').rstrip('/')


def md(s):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', E(s))


def mmss(s):
    s = int(round(s))
    return '%d:%02d' % (s // 60, s % 60)


def card(p):
    if PAY:      # Stripe-hosted Checkout through our backend; the price lives in Stripe under lookup_key = pack id
        buy = (f'<form method="post" action="{E(PAY)}/api/checkout" class="buy"><input type="hidden" name="product" value="{E(p["id"])}">'
               f'<button class="btn" type="submit">Buy · ${p["price"]}</button></form>')
    elif p.get('buy'):
        buy = f'<a class="btn" href="{E(p["buy"])}" rel="noopener">Buy · ${p["price"]}</a>'
    else:
        buy = f'<span class="btn off" title="Checkout opening soon">${p["price"]} · soon</span>'
    rows, last = [], None
    for i, it in enumerate(p['items']):
        if it['folder'] != last:
            rows.append(f'<li class="grp">{E(re.sub(r"^\d+\s+", "", it["folder"]))}</li>')
            last = it['folder']
        nm = re.sub(r'^SVV\d+\s+[^-]+-\s*', '', it['name'])
        rows.append(f'<li><button class="row" data-src="packs/{p["id"]}/{it["preview"]}" data-t="{E(nm)}" data-p="{E(p["title"])}">'
                    f'<i aria-hidden="true"></i><span>{E(nm)}</span><em>{mmss(it["dur"])}</em></button></li>')
    first = f'packs/{p["id"]}/{p["items"][0]["preview"]}' if p['items'] else ''
    blurb = ''.join(f'<p>{md(b.rstrip(":").rstrip() + ("." if b.rstrip().endswith(":") else ""))}</p>' for b in p['blurb'][:2])
    return f'''
<article class="pack" id="{p["id"]}">
  <button class="cover" data-src="{first}" data-t="{E(p["items"][0]["name"] if p["items"] else "")}" data-p="{E(p["title"])}" aria-label="Play a preview of {E(p["title"])}">
    <img src="packs/{p["cover"]}" alt="{E(p["title"])} cover" width="1200" height="1200" loading="lazy">
    <span class="play" aria-hidden="true"></span>
  </button>
  <div class="info">
    <h2>{E(p["title"])}</h2>
    <p class="meta">{p["count"]} samples · {p["minutes"]:.0f} min · {E(p["format"])}{f" · {p['zipMb']} MB" if p.get("zipMb") else ""}</p>
    <div class="blurb">{blurb}</div>
    <div class="act">{buy}<button class="btn btn-quiet list-t" aria-expanded="false" aria-controls="l-{p["id"]}">All {p["count"]} previews</button></div>
    <ol class="list" id="l-{p["id"]}" hidden>{"".join(rows)}</ol>
  </div>
</article>'''


prods = data['products']
total = sum(p['count'] for p in prods)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SignalGen Sounds — Sample Packs</title>
<meta name="description" content="Sample packs by SignalGen. Royalty-free, 24-bit WAV, made for House and Techno.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 21 18'%3E%3Cpath fill='%239bd0ff' d='M0 9h3l2-7 3 14 3-11 2 4h8v2h-9l-1-2-3 11-3-14-1 5H0z'/%3E%3C/svg%3E">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top"><div class="wrap top-in">
  <a class="logo" href="./"><svg class="mark" viewBox="0 0 21 18" aria-hidden="true"><path d="M0 9h3l2-7 3 14 3-11 2 4h8v2h-9l-1-2-3 11-3-14-1 5H0z"/></svg>SignalGen Sounds</a>
  <span class="count">{len(prods)} pack{"s" if len(prods) != 1 else ""} · {total} samples</span>
</div></header>
<main class="wrap">
  <section class="hero">
    <h1>Sample packs.</h1>
    <p class="lead">Royalty-free. 24-bit WAV. Made for House and Techno. Click any cover to listen.</p>
  </section>
  <section class="grid">{"".join(card(p) for p in prods)}
  </section>
  <p class="lic">Every pack is royalty-free for your own releases. Reselling or redistributing the samples themselves is not allowed. Instant download after payment.</p>
</main>
<div class="bar" hidden><button class="pp" aria-label="Pause">❚❚</button><div class="now"><b></b><span></span></div><div class="seek"><div></div></div></div>
<audio preload="none"></audio>
<script src="app.js"></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w').write(page)
print('index.html:', len(prods), 'packs,', total, 'samples')

# Thank-you page (Stripe success_url). Reads the order from the backend; works even if the webhook is a few seconds late.
PORTAL = data.get('portal_login_url', '')
thanks = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thank you — SignalGen Sounds</title><meta name="robots" content="noindex">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top"><div class="wrap top-in"><a class="logo" href="./"><svg class="mark" viewBox="0 0 21 18" aria-hidden="true"><path d="M0 9h3l2-7 3 14 3-11 2 4h8v2h-9l-1-2-3 11-3-14-1 5H0z"/></svg>SignalGen Sounds</a></div></header>
<main class="wrap thanks">
  <section class="hero"><h1 id="h">One moment.</h1><p class="lead" id="p">Checking your payment…</p></section>
  <div class="act" id="a"></div>
  <p class="lic">Your receipt and invoice are on their way to your email.{f' Manage purchases and invoices any time in the <a href="{E(PORTAL)}">customer portal</a>.' if PORTAL else ''}</p>
</main>
<script>
(async () => {{
  const PAY = {json.dumps(PAY)};
  const id = new URLSearchParams(location.search).get('session_id') || '';
  const h = document.getElementById('h'), p = document.getElementById('p'), a = document.getElementById('a');
  const btn = (href, t, quiet) => {{ const x = document.createElement('a'); x.className = 'btn' + (quiet ? ' btn-quiet' : ''); x.href = href; x.textContent = t; a.appendChild(x); }};
  if (!PAY || !id) {{ h.textContent = 'Thank you.'; p.textContent = 'Your receipt is on its way to your email.'; return; }}
  for (let i = 0; i < 20; i++) {{
    let o = null;
    try {{ o = await (await fetch(PAY + '/api/order?session_id=' + encodeURIComponent(id))).json(); }} catch (e) {{}}
    if (o && o.status === 'paid') {{
      h.textContent = 'Thank you.'; p.textContent = (o.product || 'Your order') + ' is ready.';
      if (o.download) btn(o.download, 'Download');
      if (o.license) {{ const k = document.createElement('code'); k.className = 'key'; k.textContent = o.license; a.appendChild(k); }}
      return;
    }}
    if (o && o.mode === 'subscription' && ['active', 'trialing'].includes(o.status)) {{ h.textContent = 'Welcome.'; p.textContent = (o.product || 'Your plan') + ' is active.'; return; }}
    if (o && o.status === 'pending') p.textContent = 'Waiting for your payment to confirm (Pix can take a moment)…';
    await new Promise(r => setTimeout(r, 3000));
  }}
  p.textContent = 'Your payment is still processing. The download link will also be in your receipt reply — or reload this page in a minute.';
}})();
</script>
</body>
</html>
'''
open(os.path.join(ROOT, 'obrigado.html'), 'w').write(thanks)
print('obrigado.html written', '(checkout live)' if PAY else '(checkout not configured)')
