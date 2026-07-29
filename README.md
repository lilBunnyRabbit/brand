# lilBunnyRabbit — brand assets

A single-page brand guide: the logo, the palette, a business card and the rules.
**[lilbunnyrabbit.github.io/brand](https://lilbunnyrabbit.github.io/brand/)**

The point of it: **drop an SVG into `src/lib/brand/logos/`, or change the seed in
`src/lib/brand/config/palette.ts`, and the whole page follows.** No component edits.

SvelteKit + Svelte 5 + Tailwind v4 on bun, prerendered by `adapter-static`, deployed to GitHub Pages.

> **Dark only.** A light mode is designed but not built — there is nothing here to invert and no
> toggle to add. The mark is still being drawn; what is published is current but not final.

## Run it

```sh
bun install
bun run dev
```

## Check it

```sh
bun run check     # svelte-check; 0 errors, 0 warnings, no `svelte-ignore a11y_*` anywhere
bun run lint      # prettier
bun test          # SVG transforms, the palette contract, the discovery layer
bun run build     # must succeed with BASE_PATH unset
```

Under the GitHub Pages base path, _before_ pushing:

```sh
BASE_PATH=/brand bun run build
mkdir -p /tmp/stage && cp -R build /tmp/stage/brand
cd /tmp/stage && python3 -m http.server 8899   # open http://localhost:8899/brand/
```

## The palette — Brand Dark v4

17 colours, every one generated from **one literal**: the seed `oklch(0.255 0.0233 230.47)`.

| group    | colours                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| Surfaces | `bg_lightest` `bg_lighter` `bg_light` **`background`** `bg_dark` `bg_darker` `bg_darkest` |
| Content  | `foreground`                                                                              |
| Brand    | `tertiary` `secondary` **`primary`** `accent`                                             |
| Identity | `cottontail`                                                                              |
| States   | `success` `warning` `error` `info`                                                        |

**The contract: every non-shade colour clears WCAG AA against every one of the seven shades.** Worst
case 4.59, `error` on `bg_lightest`. So any shade can back any section and changing a section
background never needs a contrast re-check. The page measures this live rather than quoting it, and
`tests/palette.test.ts` asserts it — if the seed moves and the contract degrades, the page says so
instead of continuing to claim 4.59.

Three things in the palette are _solved_, not chosen, and the tests prove the property rather than
trusting the number:

- **`span = 0.100`** — the ladder's half-reach. The lightest shade is the lightest colour on which
  the hardest text (`error`, lowest luminance at L 0.745) still clears AA. The tests confirm the
  contract holds at 0.100 and breaks above **0.1047**, so it ships at 96% of the true ceiling.
- **Brand chroma is an integer multiple of the seed's** — 1c, 2c, 3c, 4c for tertiary → accent, 6c
  for the states, with 5c deliberately empty so the two bands stay apart. Chroma encodes rank.
- **`cottontail` is 60% of the sRGB gamut boundary** at its lightness and hue, expressed as a
  fraction so it keeps that relationship if the seed hue moves. `Color.maxChroma` finds the boundary
  by bisection.

All nine mid colours share lightness 0.745, which is why **no two brand colours may touch** — any
pair is roughly 1:1. That is the single most important rule, and the Don't section renders it so it
looks obviously wrong.

Interaction and de-emphasis are **opacity on an existing colour**, never a new colour: hover 85%,
active 70%, muted 65%, disabled 38%, borders 67%. Composited in gamma sRGB, which is what a browser
paints. Muted text is AA-large at best — captions only, and not on the lightest two shades.

## The logo

Most of the time it is **just the mark, in one colour**, straight onto whatever it sits on. No disc,
no ground of its own.

| ink          | where                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| `primary`    | anywhere it should read as the brand — 7.06:1 on the page shade, and AA on all seven |
| `foreground` | navigation and other chrome, beside the wordmark                                     |
| `background` | on a light or white ground, where primary would vanish (2.23:1)                      |

Three sanctioned combinations, in order of how often you want them:

| combination              | form                                                   | ratio           |
| ------------------------ | ------------------------------------------------------ | --------------- |
| `background` + `primary` | the bare mark on a shade — **the default**             | 7.06            |
| `primary` + `background` | flipped, as a filled badge that carries its own ground | 7.06            |
| `primary` + `cottontail` | the bright badge                                       | 1.94, logo only |

**`cottontail` is never text.** Its only job is the mark on a primary ground. On a primary fill it is
1.94:1, which is a logotype allowance (WCAG exempts logotypes, SC 1.4.3 and 1.4.11) and nothing more
— so no stroke, no shadow, no lighter green, and no headlines. That combination survives greyscale
and all three dichromacies almost unchanged, because the two colours differ in _brightness_ rather
than hue; the page renders those simulations with measured values.

The site's own chrome sticks to the triplet — `background`, `primary`, `cottontail` — plus
`foreground` for text. The other colours appear only as documented swatches and in the Don't demo.

## How to change things

| Task                                        | What to edit                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add a logo variant**                      | Drop the `.svg` into `src/lib/brand/logos/`. That is the whole step. Optionally add an entry to `config/logos.ts` for a label or minimum size.                 |
| **Change the palette**                      | The seed in `config/palette.ts`. Everything else is a formula against it, so the swatches, the page, the card, the favicon and all four exports move together. |
| **Change the card**                         | `config/card.ts` — size, role, contact lines, which shade each face uses. Placeholder lines are struck through on the page so nobody prints a draft.           |
| **Change a rule**                           | `config/prohibitions.ts`. The Don't section is generated from it.                                                                                              |
| **Mark something as a draft**               | Name the file `….wip.svg`, or set `status: 'wip'`. The page badges it.                                                                                         |
| **Regenerate the favicon**                  | `bun run favicon [file] [ink] [disc]` — composes the lockup (disc + ears) so it cannot drift from the site.                                                    |
| **Add an export format**                    | One entry in `exportFormats` in `brand/tokens.ts` plus one render function.                                                                                    |
| **Swap the colour engine for `chromatics`** | Rewrite the body of `src/lib/color/index.ts`. Nothing else imports colour math directly.                                                                       |

### The logo filename convention

Dot-separated, every part optional, `<slug>.<token>.<token>….svg`:

```
lilbunnyrabbit.mark.v6.wip.svg
lilbunnyrabbit.wordmark.mono.on-dark.svg
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

## Why the SVG transforms exist

`src/lib/svg.ts` is the highest-risk code here, and every transform is there because a real export
needed it:

- **Design tools emit generic ids** — `svg1`, `defs1`, `path5-1-93-3-1-8`. Two problems. Inline two
  files and the second's `url(#…)` resolves to the _first_ one's mask, because the browser takes the
  first match in document order — the wrong art under the right label, silently. And ids that nothing
  references become duplicate-id errors once the same mark renders eighteen times on one page. So:
  unreferenced ids are pruned, the rest are namespaced per file (`namespaceIds`) **and** per render
  site (`instantiateSvg`). Substitution is longest-id-first, or `path5-1-93-3-1-8` corrupts
  `path5-1-93-3-1-8-4` — both of which this mark declares.
- **Roots carry absolute sizes** (`199.28448mm`) that stop CSS sizing the mark, and sometimes a
  `style="color: …"` that outranks the inherited `color` which `currentColor` reads.
- **Inkscape paints a solid mark as `style="…;fill:#ffffff;…"`** with no `currentColor` at all, so it
  is invisible on any surface matching its own fill. A single-colour file converts losslessly; a
  multi-colour one must not be touched, and isn't.
- **Line 1 is `<?xml …?>`**, invalid inside HTML and rendered as visible text.
- **Comments are not markup.** `<!-- Created with Inkscape -->` is in every export, and a comment
  mentioning `<animate` would otherwise make a static mark report as animated.
- **SMIL-animated masks** rasterise to an arbitrary mid-draw frame, and a mask can be authored fully
  hidden (non-zero `stroke-dashoffset`) so only its `<animate>` reveals it — dropping the animation
  without rewriting the offset silently loses that stroke.

## Layout

```
src/lib/color/       the colour seam — swap to chromatics here, nowhere else
src/lib/svg.ts       pure string transforms (no DOM: runs at prerender and under bun test)
src/lib/brand/
  config/            THE FILES YOU EDIT — palette, logos, card, prohibitions, meta
  logos/             DROP SVGs HERE
  logo-meta.ts       filename parsing + variant construction (pure, tested)
  discover.ts        import.meta.glob assembly (Vite-only, thin)
  tokens.ts          palette → CSS vars, the swatch view model, the exports, the contract
  vision.ts          the lockup under greyscale and the three dichromacies
  nav.ts             the only module that builds internal hrefs
src/routes/          one prerendered page
tests/               bun test
```

The palette is emitted into `<svelte:head>` as a `<style>` block. Because the site is prerendered,
that string is evaluated during `vite build` and baked into the static HTML — so the page is fully
styled on first paint with no client JS.

## Deploy

Pushing to `master` runs `.github/workflows/deploy.yml`: typecheck, test, build with
`BASE_PATH=/<repo-name>`, publish to Pages. The base path comes from the repo name, so nothing
hardcodes it.
