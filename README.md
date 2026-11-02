# SOC demonstration

Uses the existing cssweb-stack/css-shared repository without shared-template or style edits.

## On your Mac

Keep soc and css-shared beside one another. Copy the contents of this soc folder into the empty SOC clone, including .github and .gitignore. Keep the clone’s .git folder. Do not copy the enclosing soc folder into the clone.

In VS Code, add soc to the existing workspace. Right-click soc and choose Open in Integrated Terminal. Run:

```
npm ci
npm run dev
```

SOC uses port 8081 so GEO can keep running on 8080. Open the URL printed by the terminal. No shared:adopt step is needed for a new repository.

## Publish on GitHub

In the SOC repository on the GitHub website, open Settings > Pages and set Source to GitHub Actions. In GitHub Desktop select soc, commit with “Add SOC shared-foundation demonstration”, then Push origin or Publish branch. Check the Actions result. The published URL is https://cssweb-stack.github.io/soc/.

GitHub builds fetch cssweb-stack/css-shared at the configured main branch. Local builds use ../css-shared. The hourly scheduled build picks up shared changes (GitHub schedules may be delayed). Workflow dispatch also allows a manual rebuild.

## Edit locations

- src/_data/site.json: name, search scope, logo, contact details, social links, privacy and webmaster links.
- src/_data/navigation.json: navigation items and destinations.
- src/index.html and page folders: local content.
- src/_media/unit/soc-logo-white.svg: optimized department logo; original viewBox and geometry preserved.
- src/soc.css: local overrides, currently empty. Compatibility: the existing shared layout requests geo.css, so the build publishes soc.css as geo.css. That output filename contains no GEO-specific styles.
- src/_data/heroes.json: demo hero assignments. The Honolulu hero and its source credit are carried over from GEO for demonstration.
- shared.config.json: shared repository, branch and local source location.

Generated shared copies in src are ignored by Git. Edit their authoritative versions in css-shared. Do not commit generated files or node_modules.

The X link is text only, requiring no new shared icon. Its account URL and contact details were supplied by the project owner. Navigation content is placeholder material. The privacy page describes this demonstration; analytics are not configured. Search targets the published demo, which must be indexed by Google to return results.

## Scope

15 pages: homepage, five About SOC pages, three undergraduate pages, two graduate pages, faculty, support, contact, and privacy. Program pages contain no invented academic requirements. UH branding, language services, university links and responsive shell are unchanged.
