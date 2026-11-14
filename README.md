# Department of Sociology

Draft Eleventy website using the College of Social Sciences shared system.
Read `AGENTS.md` and `../css-shared/docs/soc-migration.md` before making changes.

## Local development

```sh
npm ci
npm run dev
```

Development port: 8086. Build with `npm run build`, then check with `npm run verify`.
For the GitHub Pages prefix, build with `SITE_PATH_PREFIX=/soc/ npm run build` and
check with `python3 scripts/verify-site.py /soc`. Rebuild without that environment
variable before running the root-based development preview.

Each content page has its own HTML file in `src`, including faculty profiles.
Titles and descriptions are in page front matter. Folder destinations use
`index.html`. `reference/url-inventory.csv` maps every published source URL to a
proposed destination or flags it for review. These are not deployed redirects.

Shared SOC data lives in `../css-shared/src/data/units/soc/`: edit `heroes.json`
for page image assignments/crops and `site-settings.json` for responsive hero heights
and overlay. All heroes are temporary placeholders. News and Events has an X feed
placeholder; integration is deferred. Search indexing is disabled for this draft.

Original XML, migration report, media report, and URL inventory are retained in
`reference/`. Consult the migration document before rerunning the importer, which
would overwrite edited pages. No hosting publication has been performed.

## Imported-media cleanup

Unused original imported media and its retired downloader were moved out of
`src` into ignored `_remove/` on November 13, 2026. That local folder can be moved
out of the checkout; it is not published or included in fresh clones. Current
SOC images are maintained in `../css-shared/src/media/`, with unit-specific assets
under `units/soc/`. Do not restore the old image download workflow.
Keep `reference/` as migration evidence, not as an instruction to regenerate pages.
