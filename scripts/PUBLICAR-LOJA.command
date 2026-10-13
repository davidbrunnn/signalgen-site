#!/bin/bash
# Duplo clique: refaz o catálogo (seed) e sobe os produtos da loja para o site em produção (Vercel Blob).
cd "$(dirname "$0")/.."
export PATH="$HOME/Desktop/SignalGen/codigo/music-gen/engine/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
mkdir -p _check; exec > >(tee _check/publicar.log) 2>&1
node scripts/seed-local.mjs | tail -2
python3 ../music-gen/tools/loja_produtos.py && echo "PRONTO. Pode fechar." || echo "FALHOU — mande print para o Claude."
