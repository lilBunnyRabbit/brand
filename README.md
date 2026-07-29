# lilBunnyRabbit — brand assets

A single-page brand guide: the logo variants and the colour palette, everything copyable and
downloadable. **[lilbunnyrabbit.github.io/brand](https://lilbunnyrabbit.github.io/brand/)**

The point of it: **drop an SVG into `src/lib/brand/logos/`, or change one seed colour in
`src/lib/brand/config/palette.ts`, and the whole page follows.** No component edits.

SvelteKit + Svelte 5 + Tailwind v4 on bun, prerendered by `adapter-static`, deployed to GitHub Pages.

> The mark is still being drawn. What is published is current but not final.

## Run it

```sh
bun install
bun run dev
```

## Check it

```sh
bun run check     # svelte-check; 0 errors, 0 warnings, no `svelte-ignore a11y_*` anywhere
bun run lint      # prettier
bun test          # SVG transforms, the palette formulas, the discovery layer
bun run build     # must succeed with BASE_PATH unset
```

To verify the site under the GitHub Pages base path _before_ pushing:

```sh
BASE_PATH=/brand bun run build
mkdir -p /tmp/stage && cp -R build /tmp/stage/brand
cd /tmp/stage && python3 -m http.server 8899   # open http://localhost:8899/brand/
```

`build/` must contain `.nojekyll`, `404.html` and `favicon.svg`.

## How to change things

| Task                                        | What to edit                                                                                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add a logo variant**                      | Drop the `.svg` into `src/lib/brand/logos/`. That is the whole step — it is auto-discovered. Optionally add an entry to `config/logos.ts` for a label, minimum size or clear space.      |
| **Change the palette**                      | One seed in `config/palette.ts`. Every other colour is a formula against it, so the swatches, the page chrome, the CSS/Tailwind/JSON/Markdown exports and the favicon all move together. |
| **Mark something as a draft**               | Name the file `….wip.svg`, or set `status: 'wip'` in `config/logos.ts`. The page badges it and the hero shows a notice.                                                                  |
| **Regenerate the favicon**                  | `bun run favicon [source-file] [ink-swatch]` — derived from a mark so it cannot drift. Defaults to the current mark inked in `primary`.                                                  |
| **Add an export format**                    | One entry in `exportFormats` in `brand/tokens.ts` plus one render function. The UI iterates the registry, so no component changes.                                                       |
| **Swap the colour engine for `chromatics`** | Rewrite the body of `src/lib/color/index.ts`. Nothing else imports colour math directly.                                                                                                 |

### The logo filename convention

Dot-separated, every part optional, `<slug>.<token>.<token>….svg`:

```
lilbunnyrabbit.mark.v6.wip.svg
lilbunnyrabbit.wordmark.mono.on-dark.svg
lilbunnyrabbit.favicon.32.svg
whatever.svg                    still renders — a colour mark, with a hint to rename
```

| Axis          | Values                                                         | Default  |
| ------------- | -------------------------------------------------------------- | -------- |
| form          | `mark` `wordmark` `lockup` `icon` `favicon` `avatar` `pattern` | `mark`   |
| tone          | `color` `mono` `duo` `inverse`                                 | `color`  |
| surface       | `on-light` `on-dark` `on-any`                                  | `any`    |
| version       | `v1`, `v2`, …                                                  | none     |
| speed         | `fast` `slow`                                                  | `normal` |
| status        | `wip` `final`                                                  | `final`  |
| motion        | `animated` `static` (a _hint_ — the file is the authority)     | detected |
| size          | a bare integer                                                 | none     |
| anything else | becomes a tag                                                  | —        |

Unknown tokens never error. A file with no `<svg>` root is listed as unreadable and skipped — one bad
export must not block deploying the others.

## The palette

Every colour derives from one seed, `background = oklch(0.255 0.0233 230.47)`:

| name                               | formula                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `background-lighter` / `-lightest` | `$background.l + 0.05 / + 0.1`, chroma `+0.005 / +0.01`         |
| `background-darker` / `-darkest`   | `$background.l − 0.05 / − 0.1`, chroma `+0.005 / +0.01`         |
| `foreground`                       | `1 − $background.l`, `$background.c / 3`, `$background.h + 180` |
| `primary`                          | `$foreground.l`, `$background.c * 3`, `$foreground.h + 72`      |
| `secondary`                        | `$primary` rotated 180°                                         |
| `accent`                           | `$primary` at the foreground hue                                |
| `success` `warning` `error` `info` | `$primary.l`, `$primary.c * 2`, fixed hues 140 / 70 / 30 / 240  |

Chroma _rises_ as lightness moves away from the seed in either direction, which is what keeps the
dark steps blue instead of muddy. `tests/palette.test.ts` asserts every derived hex against the
authored table, so a mis-transcribed formula fails the build rather than shipping.

`background-darkest` sits marginally outside sRGB (it clamps `#000e18` → `#000e17`, one step in
blue) and is inside P3. The page badges it rather than hiding it.

## Why the SVG transforms exist

`src/lib/svg.ts` is the highest-risk code here, and every transform is there because a real export
needed it:

- **Design tools emit generic ids** — `svg1`, `defs1`, `path5-1-93-3-1-8`. Two problems. Inline two
  files and the second's `url(#…)` resolves to the _first_ one's mask, because the browser takes the
  first match in document order — the wrong art under the right label, silently. And ids that
  nothing references are dead weight that becomes a duplicate-id error once the same mark renders
  five times on one page. So: unreferenced ids are pruned, the rest are namespaced per file
  (`namespaceIds`) _and_ per render site (`instantiateSvg`). Substitution is longest-id-first, or
  `path5-1-93-3-1-8` corrupts `path5-1-93-3-1-8-4` — both of which this mark declares.
- **Roots carry absolute sizes** (`199.28448mm`) that stop CSS sizing the mark, and sometimes a
  `style="color: …"` that outranks the inherited `color` which `currentColor` reads.
- **Inkscape paints a solid mark as `style="…;fill:#ffffff;…"`** with no `currentColor` at all, so it
  is invisible on any surface matching its own fill. A single-colour file converts losslessly; a
  multi-colour one must not be touched, and isn't.
- **Line 1 is `<?xml …?>`**, invalid inside HTML and rendered as visible text.
- **Comments are not markup.** `<!-- Created with Inkscape -->` is in every export, and a comment
  mentioning `<animate` would otherwise make a static mark report as animated.
- **SMIL-animated masks** rasterise to an arbitrary mid-draw frame, and a mask can be authored fully
  hidden (non-zero `stroke-dashoffset`) so that only its `<animate>` reveals it — dropping the
  animation without rewriting the offset silently loses that stroke.

## Layout

```
src/lib/color/       the colour seam — swap to chromatics here, nowhere else
src/lib/svg.ts       pure string transforms (no DOM: runs at prerender and under bun test)
src/lib/brand/
  config/            THE FILES YOU EDIT — palette, logos, meta
  logos/             DROP SVGs HERE
  logo-meta.ts       filename parsing + variant construction (pure, tested)
  discover.ts        import.meta.glob assembly (Vite-only, thin)
  tokens.ts          palette → CSS vars + the export formats
  nav.ts             the only module that builds internal hrefs
src/routes/          one prerendered page
tests/               bun test
```

The palette is emitted into `<svelte:head>` as a `<style>` block. Because the site is prerendered,
that string is evaluated during `vite build` and baked into the static HTML — so the page is fully
styled on first paint with no client JS.

The page surface is deliberately light while the palette it documents is dark: `--page-*` is the
document's own chrome, `--brand-*` is the subject matter. Interactive accents come from the dark end
of the palette, where the contrast against white is real.

## Deploy

Pushing to `master` runs `.github/workflows/deploy.yml`: typecheck, test, build with
`BASE_PATH=/<repo-name>`, publish to Pages. The base path comes from the repo name, so nothing
hardcodes it.
