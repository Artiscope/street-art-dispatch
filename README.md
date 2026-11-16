# Street Art Dispatch

The Urban Art and Culture Publication. Live at https://streetartdispatch.com once the domain is pointed here, and at https://artiscope.github.io/street-art-dispatch/ until then.

This is a plain static site. There is nothing to install.

## How to change things

| To change | Edit this file |
|---|---|
| Articles, columns, artists, archive entries, exhibitions, the collecting primer, About and Contact | `data/content.json` |
| Colours, fonts, spacing | `assets/site.css` |
| Menu, sign-up box, archive search | `assets/site.js` |
| Page layouts | `tools/build.py` |

The pages are built from these files every time a change is pushed, so there are no built pages to edit by hand. To check a change on your own computer first:

```
python3 tools/build.py _site
```

Then open `_site/index.html`.

## Adding an archive entry

Copy an entry under `archive` in `data/content.json` and fill it in. Use `"y": "TBC"` and `"pending": true` for an entry whose date is not confirmed, and the page shows "Awaiting confirmation".

## Colours and typefaces

Vanilla Linen #EFE6D3 (60%), Pine Lacquer #163A30 (30%), Ruby Red #F0283C (10%, buttons only). Gloock for headings, Source Serif 4 for reading text, Libre Franklin for labels and buttons.

## Logo

The logo files are in `assets/brand/`, and the guide on how to use them is `brand/Street-Art-Dispatch-logo-guidelines.pdf`. The files are drawn by `tools/make_logo.py`, which needs the Gloock typeface file for the versions that include the name:

```
python3 tools/make_logo.py path/to/Gloock-Regular.ttf
```

`DEVELOPMENT.md` holds the original editorial and build plan.
