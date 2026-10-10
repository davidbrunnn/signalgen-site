# SignalGen Sounds · marketplace

Live: https://davidbrunnn.github.io/signalgen-site/ (GitHub Pages, static: `index.html`, `style.css`, `app.js`, `packs/`).

**Rule:** the marketplace shows exactly the packs in `~/Desktop/samples/Venda` on the Mac — nothing else.
Each folder there is one product (cover `Capa.png`, the WAVs in subfolders, `README.md`, the sale `.zip`).

## Update

1. Mac: `python3 ~/Desktop/SignalGen/codigo/loja-venda/exporta.py` → `out/` (`venda.json`, `<id>/cover.jpg`, `<id>/p/NN.mp3`
   14 s previews). Prices and checkout links: `~/Desktop/SignalGen/codigo/loja-venda/precos.json`
   (`{"Speech Vocals Volume I": {"price": 19, "buy": "https://buy.stripe.com/..."}}`; without `buy` the button shows "soon").
2. Here: `packs/` = the product folders from `out/`, `scripts/venda.json` = `out/venda.json`, then `python3 scripts/build.py`.
3. Commit and push `main`. Pages redeploys on its own.

The sale zips are never uploaded here (the repo is public); only covers and 14 s MP3 previews are.

The previous Next.js code (`app/`, `lib/`, `public/`) is not served by Pages and is kept only as history.
