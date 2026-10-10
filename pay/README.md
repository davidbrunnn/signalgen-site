# signalgen-pay — Stripe backend for SignalGen Sounds

Stripe-hosted Checkout + webhook fulfillment for the static store (GitHub Pages). Plain Vercel functions, no framework.
Plan from Stripe's implementation planner: hosted Checkout Sessions (Payments), subscriptions with the Customer Portal and
Smart Retries (Billing), an invoice for every one-time purchase (Invoicing). Stripe Tax: see the last section.

| Route | What it does |
|---|---|
| `POST /api/checkout` (`product=<lookup_key>`) | Finds the active Price by lookup key → Checkout Session → 303 to Stripe. One-time prices: `mode=payment` + `invoice_creation` + `customer_creation=always`. Recurring: `mode=subscription`. No `payment_method_types` (methods come from the Dashboard). |
| `POST /api/webhook` | Verifies the signature, fulfills on `checkout.session.completed` **and** `checkout.session.async_payment_succeeded` (Pix is async) only when `payment_status` isn't `unpaid`. Logs subscription and invoice lifecycle events. |
| `GET /api/order?session_id=` | Data for `obrigado.html`: paid/pending, download link, license key. Fulfills too (idempotent), so a late webhook never blocks the buyer. |
| `GET /api/download?session_id=` | 302 to the pack's zip, only for paid sessions. |
| `POST /api/portal` (`session_id`) | Customer portal session for that buyer. Everyone can also use the portal login link. |

Fulfillment is recorded on the PaymentIntent metadata (`fulfilled_at`, `license_key`) — no database needed.

## Catalog (already created in the sandbox "Signal Creative Art sandbox")

| Product | Price | lookup_key | Tax code |
|---|---|---|---|
| Speech Vocals Volume I | US$ 19 one-time | `speech-vocals-volume-i` | `txcd_10401100` Digital Audio Works – downloaded – permanent rights |
| Speech Vocals Volume II | US$ 19 one-time | `speech-vocals-volume-ii` | `txcd_10401100` |
| SignalGen Lifetime (`metadata.kind=license`) | R$ 249 one-time | `signalgen-lifetime` | `txcd_10202000` Downloadable Software – personal use |
| SignalGen Monthly | US$ 19 / month | `signalgen-monthly` | `txcd_10202000` |

A new pack on sale = a Product with `metadata.kind=pack` and a Price whose `lookup_key` is the pack's folder slug
(the same id the store uses), plus its zip URL in `DOWNLOADS`. Tax codes: confirm with your accountant
([tax code list](https://docs.stripe.com/tax/tax-codes)). Customer portal config `bpc_1UOroaFMGJCePkVS79SaCL6d`
(invoice history, payment method, cancel at period end, login page on).

## Deploy (Vercel)

1. Vercel → Add New Project → `davidbrunnn/signalgen-site`, **Root Directory = `pay`**, Framework = Other.
2. Environment variables (mark as *Sensitive*):
   - `STRIPE_SECRET_KEY` — a **restricted key** (`rk_test_…` first, `rk_live_…` later) with write on Checkout Sessions,
     Customer portal, PaymentIntents; read on Prices, Products, Subscriptions. Never commit it.
   - `STRIPE_WEBHOOK_SECRET` — from step 3.
   - `SITE_URL` = `https://davidbrunnn.github.io/signalgen-site`
   - `DOWNLOADS` = `{"speech-vocals-volume-i":"https://…zip","speech-vocals-volume-ii":"https://…zip"}` (unguessable URLs, e.g. Vercel Blob with random suffix)
   - `LICENSE_SEED_HEX` — the same seed as the Mac keygen (only needed for SignalGen Lifetime).
3. Stripe → Developers → Webhooks → Add endpoint `https://<pay-domain>/api/webhook`, events listed in `api/webhook.js`.
4. Store: put `"pay_url": "https://<pay-domain>"` in `scripts/venda.json`, `python3 scripts/build.py`, push. Buttons go live.

Local test: `stripe listen --forward-to localhost:3000/api/webhook` + `vercel dev` in `pay/`, pay with test card 4242 4242 4242 4242.

## Dashboard switches (no code)

- **Payment methods**: turn on Pix (and Link, Apple Pay/Google Pay). Today the sandbox shows card only.
- **Branding**: logo, colors, name "SignalGen" (Checkout, receipts, invoices).
- **Billing → Revenue recovery**: Smart Retries on, failed-payment emails on, automatic card updates on.
- **Emails**: successful payments + refunds receipts on.
- **Adaptive Pricing** is on: foreign buyers see local currency.

## Stripe Tax

The account is in Brazil, and Stripe Tax isn't available for Brazilian accounts yet (the Tax Settings API returns
"Stripe Tax isn't yet supported for your country"), so `automatic_tax` is off on purpose and **no tax is calculated or
collected**. Managed Payments (Stripe as merchant of record) also requires a business in the US/CA/EU/UK/CH/NO/AU/JP/SG/HK.
Tax obligations on international digital sales (and Brazilian NF-e) need your accountant. When it becomes available,
it's `automatic_tax: { enabled: true }` in `api/checkout.js` after adding registrations.
