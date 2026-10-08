#!/bin/bash
# Self-test of the local store (run by Claude through the SignalGen Studio app): production build, then the whole sale
# walked with curl — catalog, track page, checkout, test payment, thanks, download, certificate, double-sale guard —
# then the catalog is reset to all 10 tracks available. Output: _check/ (log + rendered pages for screenshots).
cd "$(dirname "$0")/.."
export PATH="$HOME/Desktop/SignalGen/codigo/music-gen/engine/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
rm -rf _check; mkdir -p _check
exec > >(tee _check/check.log) 2>&1
echo "== node $(node -v)"
echo "== npm install"; [ -d node_modules/next ] || npm install --no-audit --no-fund || { echo NPM_FAILED; exit 1; }
echo "== seed"; rm -f local-data/orders.json local-data/catalog.json; node scripts/seed-local.mjs || { echo SEED_FAILED; exit 1; }
echo "== build"; npx next build || { echo BUILD_FAILED; exit 1; }
PORT=3021; B="http://localhost:$PORT"
lsof -ti tcp:$PORT | xargs kill 2>/dev/null
npx next start -p $PORT > _check/server.log 2>&1 & PID=$!
for i in $(seq 1 40); do curl -s -o /dev/null "$B/" && break; sleep 0.5; done
ID=$(node -e "console.log(require('./local-data/catalog.json').tracks[0].id)")
code() { curl -s -o "$2" -w "%{http_code}" "$1"; }
echo "home        $(code "$B/" _check/home.html)"
echo "track       $(code "$B/t/$ID" _check/track.html)"
echo "license     $(code "$B/license" _check/license.html)"
echo "404         $(code "$B/t/nope" _check/notfound.html)"
CO=$(curl -s -X POST "$B/api/checkout" -H 'content-type: application/json' -d "{\"id\":\"$ID\"}"); echo "checkout    $CO"
URL=$(node -e "console.log(JSON.parse(process.argv[1]).url||'')" "$CO")
echo "checkoutpg  $(code "$B$URL" _check/checkout.html)"
BAD=$(curl -s -X POST "$B/api/local/pay" -H 'content-type: application/json' -d "{\"id\":\"$ID\",\"email\":\"nope\"}"); echo "bad email   $BAD"
PAY=$(curl -s -X POST "$B/api/local/pay" -H 'content-type: application/json' -d "{\"id\":\"$ID\",\"email\":\"buyer@label.com\"}"); echo "pay         $PAY"
TH=$(node -e "console.log(JSON.parse(process.argv[1]).url||'')" "$PAY")
echo "thanks      $(code "$B$TH" _check/thanks.html)"
SID=${TH#*session_id=}
echo "certificate $(code "$B/license/$SID" _check/certificate.html)"
for T in $(grep -o '/api/download?t=[A-Za-z0-9_-]*' _check/thanks.html | sort -u); do
  echo "download    $(curl -s -o /dev/null -w '%{http_code} %{size_download} bytes %{content_type}' "$B$T")"
done
echo "bad token   $(curl -s -o /dev/null -w '%{http_code}' "$B/api/download?t=abc")"
echo "resell      $(curl -s -X POST "$B/api/checkout" -H 'content-type: application/json' -d "{\"id\":\"$ID\"}")"
echo "home after  $(code "$B/" _check/home_after.html)"
echo "sold page   $(code "$B/t/$ID" _check/track_sold.html)"
kill $PID 2>/dev/null; wait $PID 2>/dev/null
mkdir -p _check/_next/static && cp -R .next/static/css _check/_next/static/
echo "== reset: all 10 tracks available again"
rm -f local-data/orders.json local-data/catalog.json; node scripts/seed-local.mjs | tail -1
echo CHECK_DONE
