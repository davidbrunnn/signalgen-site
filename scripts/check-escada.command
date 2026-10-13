#!/bin/bash
# 13/10/2026 — self-test of the price ladder (run on the Mac by the SignalGen Studio app, pedido {"compila":"site"}):
# seed → production build → server → home, /refiner, /tempo, a pack page in BR and US, the free Tempo flow (e-mail → key) and a
# local test purchase of a pack in BRL. Output: _check/escada.log + rendered pages.
cd "$(dirname "$0")/.."
export PATH="$HOME/Desktop/SignalGen/codigo/music-gen/engine/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
mkdir -p _check; exec > >(tee _check/escada.log) 2>&1
echo "== node $(node -v)"
echo "== seed"; rm -f local-data/orders.json local-data/catalog.json; node scripts/seed-local.mjs | tail -3 || { echo SEED_FAILED; exit 1; }
echo "== build"; npx next build 2>&1 | tail -25 || { echo BUILD_FAILED; exit 1; }
grep -q "Compiled successfully\|Generating static pages" .next/trace 2>/dev/null; [ -d .next/server ] || { echo BUILD_FAILED; exit 1; }
PORT=3022; B="http://localhost:$PORT"
lsof -ti tcp:$PORT | xargs kill 2>/dev/null
npx next start -p $PORT > _check/escada-server.log 2>&1 & PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null "$B/" && break; sleep 0.5; done
code() { curl -s -o "$2" -w "%{http_code}" "$1"; }
KIT=$(node -e "console.log(require('./local-data/catalog.json').tracks.find(t=>t.vol===13&&t.kind==='kit').id)")
echo "home BR     $(code "$B/" _check/e-home.html)   $(grep -o 'R\$ 199' _check/e-home.html | head -1) $(grep -o 'R\$ 49,90' _check/e-home.html | head -1) $(grep -o 'R\$ 19,90' _check/e-home.html | head -1)"
echo "home US     $(code "$B/?country=US" _check/e-home-us.html)   $(grep -o 'US\$ 49' _check/e-home-us.html | head -1) $(grep -o 'US\$ 12,90\|US\$ 12.90' _check/e-home-us.html | head -1)"
echo "refiner     $(code "$B/refiner" _check/e-refiner.html)   $(grep -o 'R\$ 49,90' _check/e-refiner.html | head -1)"
echo "tempo       $(code "$B/tempo" _check/e-tempo.html)   $(grep -c 'freeform' _check/e-tempo.html) form"
echo "pack BR     $(code "$B/p/$KIT" _check/e-pack.html)   $(grep -o 'R\$ 19,90' _check/e-pack.html | head -1)"
echo "pack US     $(code "$B/p/$KIT?country=US" _check/e-pack-us.html)   $(grep -o 'US\$ [0-9]*' _check/e-pack-us.html | head -1)"
echo "signalgen   $(code "$B/signalgen" _check/e-sg.html)"
FR=$(curl -s -X POST "$B/api/free" -H 'content-type: application/json' -d '{"id":"tempo","email":"teste@signalgen.test"}'); echo "free        $FR"
TH=$(node -e "console.log(JSON.parse(process.argv[1]).url||'')" "$FR"); echo "free thanks $(code "$B$TH" _check/e-free-thanks.html)   $(grep -o 'SGN1[^<]*' _check/e-free-thanks.html | head -1 | cut -c1-24)"
FR2=$(curl -s -X POST "$B/api/free" -H 'content-type: application/json' -d "{\"id\":\"$KIT\",\"email\":\"teste@signalgen.test\"}"); echo "free (pack, must fail) $FR2"
PAY=$(curl -s -X POST "$B/api/local/pay" -H 'content-type: application/json' -d "{\"id\":\"$KIT\",\"email\":\"buyer@label.com\"}"); echo "pay BR      $PAY"
echo "order       $(node -e "const o=require('./local-data/orders.json').find(o=>o.trackId==='$KIT');console.log(o&&o.amount, o&&o.currency)")"
TH2=$(node -e "console.log(JSON.parse(process.argv[1]).url||'')" "$PAY"); echo "pay thanks  $(code "$B$TH2" _check/e-pay-thanks.html)"
CO=$(curl -s -X POST "$B/api/checkout" -H 'content-type: application/json' -d '{"id":"tempo"}'); echo "checkout(tempo→free) $CO"
kill $PID 2>/dev/null; rm -f local-data/orders.json
echo "== done"
