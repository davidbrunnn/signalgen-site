# SignalGen site

The site for SignalGen, the advanced songstarter for Ableton Live: pick a genre, a key, a tempo and a mood, and it writes
the whole track and opens it in Live arranged, mixed and mastered. Next.js 14 · Vercel · Vercel Blob.

The page sells one thing, SignalGen: a lifetime license for R$ 249, Pix or card through Stripe Checkout. Until the sales
secrets are set it shows the early access list instead.

## Run it on the Mac

```
cd signalgen-site
npm install
npm run dev        # http://localhost:3000
```

Without `BLOB_READ_WRITE_TOKEN`, early access signups go to `.data/waitlist.jsonl` (localhost only, not committed).

## What's on the page

- **Hero**: the plugin's four choices and NEW STARTER. The arrangement is drawn in the browser to show the process;
  the audio under it is a real render from the engine (`lib/site.ts` → `DEMOS`).
- **The set**: the tracks of a real starter (Capricornus Dionysus), grouped as they open in Live.
- **Screens**: real plugin screenshots in `public/screens/`.
- **Listen**: four real 30 s previews from `~/Desktop/SignalGen/Venda/<title>/Entrega/` in `public/demos/`
  (`.m4a` + cover `.jpg`, 720 px). To swap one: copy the files and edit `DEMOS` in `lib/site.ts`.
  If the Blob catalog has tracks (the Mac's `v2 loja publica`), the newest six previews also show under the demos.
- **Pricing**: `NEXT_PUBLIC_PRICE_MONTHLY` (default 19) and `NEXT_PUBLIC_PRICE_LIFETIME` (default 249), in USD.

All copy and facts live in `app/page.tsx` and `lib/site.ts`. Styles: `app/globals.css` (Helvetica bold, dark, baby
blue #9BD0FF, type and spacing on the Fibonacci scale 13 · 21 · 34 · 55 · 89).

## Sales (Stripe Checkout, Pix + card)

- `POST /api/checkout` (the Buy button) opens a Checkout session in BRL for `PRICE_BRL`. No payment methods are listed in
  code: Stripe shows the ones switched on in the Dashboard (card and Pix).
- After paying, Stripe sends the buyer to `/thanks?session_id=…`, which shows the license key at once. Pix can take a few
  seconds: the page waits and refreshes itself until the session is paid.
- `/api/webhook` (`checkout.session.completed`, `checkout.session.async_payment_succeeded`) keeps the order in Blob
  (`signalgen/orders/`) and emails the key through Resend when `RESEND_API_KEY` and `MAIL_FROM` are set.
- Keys are the plugins' own offline `SGN1-…` keys (`lib/license.ts`, byte-for-byte the Mac's `tools/license/keygen.py`):
  product SignalGen, edition full, serial = top bit + 31 bits of the session id's SHA-256 (never meets the Mac's 1, 2, 3…),
  issued day = the session's day. Ed25519 is deterministic, so the thank-you page and the email rebuild the same key.
- The checkout stays closed if `SIGNALGEN_LICENSE_PRIVATE_KEY` is not the pair of `license/public_key.hex` (it would sell keys
  that don't activate).
- Every sale: `curl -H "Authorization: Bearer $PUBLISH_TOKEN" https://<site>/api/orders`. To revoke one, use its serial with
  `keygen.py revoke` on the Mac.

## Early access list

`POST /api/waitlist {email}` writes one JSON per signup to Blob (`signalgen/waitlist/`). Read the list with
`curl -H "Authorization: Bearer $PUBLISH_TOKEN" https://<site>/api/waitlist`.

## Endpoints the Mac still uses (no page links to them)

`/api/publish` (catalog, Bearer `PUBLISH_TOKEN`) · `/api/judge` (votes for `v2 juiz aprende`) · `/api/pack/jobs` and
`/api/pack/status` (jobs already paid) · `/api/webhook` (Stripe). The marketplace pages (track pages, checkout, downloads,
`/pack`, `/judge`) were removed when the site moved to SignalGen only; they are in git history.

## Deploy (Vercel)

1. Import `davidbrunnn/signalgen-site` in Vercel (Next.js, defaults).
2. Storage → Blob → connect to the project (`BLOB_READ_WRITE_TOKEN` is added for you).
3. Set `PUBLISH_TOKEN` (any long string). See `.env.example`.
4. To open sales: Stripe account → Settings › Payment methods: turn on Pix and cards → set `STRIPE_SECRET_KEY`,
   `SIGNALGEN_LICENSE_PRIVATE_KEY`, `DOWNLOAD_URL_MAC` (and Resend) → add the webhook (above) and set
   `STRIPE_WEBHOOK_SECRET` → redeploy. Rehearse once with `sk_test_…` keys and test card 4242 4242 4242 4242.
