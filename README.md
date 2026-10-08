# Opus Magnum

A brochure site for Opus Magnum, the vendor management system from Opus People Solutions. The book on the page turns like paper, and the brass magnifier reads the spreads up close.

Started from a copy of the [sketchbook](https://github.com/matthewyuart/personalportfolio) page-turn.

## The book

The ten spreads in `spreads/` are SVGs drawn by `tools/build-spreads.mjs`: a title page with the contents, then nine chapters.

1. Requests for staff
2. Release to agencies
3. Candidates
4. Selection and placement
5. Timesheets and expenses
6. Shifts and compliance
7. Invoicing
8. Exports and payments
9. Audit and IR35

Change the wording or the diagrams there, then rebuild:

```sh
node tools/build-spreads.mjs
```

To add or reorder a chapter, change it in three places in `tools/build-spreads.mjs`: the `CHAPTERS` list (the contents page), the spread itself, and the page number passed to `book()`. Then add it to `PAGES` in `index.html`, which drives the book and the Contents list on the page.

Each spread keeps the 1760 x 1240 frame, with the paper inside x 5.1–94.9% and y 21.8–78.2%. The page-turn and the magnifier in `index.html` depend on that geometry.

## Type

The site is set in Livvic, the shiftControl app's typeface, self-hosted from `assets/livvic/` (latin faces only) so no request goes to Google. An SVG drawn as an image cannot load fonts, so the build embeds Livvic in every spread.

## Run locally

```sh
python -m http.server 4180
```

## Deployment

Every push to `main` deploys through [the Pages workflow](.github/workflows/pages.yml) to www.opusmagnum.live (set in `CNAME`). The bare opusmagnum.live is kept free for the platform itself.

## Still to do

- Point the `www` DNS record at GitHub: a CNAME to `derek-dmax.github.io`. Then turn on Enforce HTTPS in the repo's Pages settings.
- The contact address (the link in the Contact section is a placeholder).
- The log in dialog is a dummy: it sends nothing, and says sign-in is not open yet.
