# SignalGen site

The site for SignalGen, the advanced songstarter for Ableton Live: pick a genre, a key, a tempo and a mood, and it writes
the whole track and opens it in Live arranged, mixed and mastered. Next.js 14 · Vercel · Vercel Blob.

The page sells one thing, SignalGen, and collects an early access list until sales open.

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
3. Set `PUBLISH_TOKEN` (any long string) and, if you want, the two price variables. See `.env.example`.
