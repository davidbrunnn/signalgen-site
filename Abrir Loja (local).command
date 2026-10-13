#!/bin/bash
# SIGNAL STUDIO — local preview. Double-click: installs once, loads the 10 tracks from ~/Desktop/SignalGen/Venda and opens
# http://localhost:3000 in the browser. Close this Terminal window to stop the site. No Stripe key needed (test checkout).
cd "$(dirname "$0")"
export PATH="$HOME/Desktop/SignalGen/codigo/music-gen/engine/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then echo "Node not found."; read -n1; exit 1; fi
[ -d node_modules/next ] || npm install --no-audit --no-fund || { echo "npm install failed"; read -n1; exit 1; }
node scripts/seed-local.mjs
lsof -ti tcp:3000 | xargs kill 2>/dev/null
(sleep 7; open "http://localhost:3000") &
exec npx next dev -p 3000
