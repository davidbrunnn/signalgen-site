# SIGNAL STUDIO

Marketplace minimalista das faixas que o motor SignalGen produz e o Davin não vai lançar: US$ 59 por faixa (Extended Mix + Radio Edit,
WAV 44,1 kHz / 24 bit, masterizada com devices nativos do Live), licença exclusiva. Next.js 14 · Stripe Checkout · Vercel Blob.

## Subir (uma vez)
1. Vercel → **Add New Project** → importe `davidbrunnn/signalgen-site` (framework Next.js, sem mudar nada).
2. Vercel → projeto → **Storage → Create → Blob** → *Connect to project* (a variável `BLOB_READ_WRITE_TOKEN` entra sozinha).
3. Stripe → **Developers → API keys**: copie a *Secret key* → Vercel → Settings → Environment Variables → `STRIPE_SECRET_KEY`.
4. Stripe → **Developers → Webhooks → Add endpoint**: `https://<seu-dominio>/api/webhook`, evento `checkout.session.completed` →
   copie o *Signing secret* → `STRIPE_WEBHOOK_SECRET`.
5. Invente duas strings longas: `PUBLISH_TOKEN` (o Mac usa para publicar) e `DOWNLOAD_SECRET` (assina os links de download).
   `SITE_URL` = o domínio público (sem barra). `PRICE_USD` = 59. Veja `.env.example`. Redeploy.
6. No Mac, `~/Desktop/SignalGen/codigo/music-gen/engine/loja.json`:
   `{"site": "https://<seu-dominio>", "publish_token": "<PUBLISH_TOKEN>", "blob_token": "<BLOB_READ_WRITE_TOKEN>", "artista": "Davin"}`
   (o blob token está em Vercel → Storage → Blob → `.env.local` tab).

## Como entra faixa
`python3 tools/motor2.py v2 loja publica` no Mac (ou o pedido `{"v2": ["loja", "publica"]}`): escolhe as 5 melhores do dia
(nota prevista / gosto do motor), garante a entrega G104 (master + radio edit + preview), sobe os arquivos para o Blob e grava o
catálogo. `v2 loja publica "<Título>"` publica uma faixa específica; `v2 loja tira "<id>"` remove; `v2 loja lista` mostra o catálogo.

## Rotas
`/` catálogo (os 5 do dia + o resto) · `/t/<id>` a faixa · `POST /api/checkout` → Stripe Checkout · `/thanks?session_id=` links
assinados (7 dias) · `GET /api/download?t=` · `POST/DELETE/GET /api/publish` (Bearer PUBLISH_TOKEN) · `POST /api/webhook` (Stripe).
