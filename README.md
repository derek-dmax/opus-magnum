# Opus Magnum

A brochure site for Opus Magnum, the vendor management system from Opus People Solutions. The book on the page turns like paper, and the brass magnifier reads the spreads up close.

Started from a copy of the [sketchbook](https://github.com/matthewyuart/personalportfolio) page-turn.

## The book

The nine spreads in `spreads/` are SVGs drawn by `tools/build-spreads.mjs`: a title page, then a chapter each on requests, release to agencies, candidates, placement, shifts, invoicing, exports, and audit and IR35. Change the wording or the diagrams there, then rebuild:

```sh
node tools/build-spreads.mjs
```

Each spread keeps the 1760 x 1240 frame, with the paper inside x 5.1–94.9% and y 21.8–78.2%. The page-turn and the magnifier in `index.html` depend on that geometry.

## Run locally

```sh
python -m http.server 4173
```

## Still to do

- The contact address (the link in the Contact section is a placeholder).
- The final name and domain.
