/**
 * `/llms.txt` — the machine-readable guide, generated at build time.
 *
 * Prerendered by adapter-static into a real `llms.txt` file, so nothing changes for consumers —
 * but every value in it is read from `config/palette*.ts` at build. The old hand-written
 * `static/llms.txt` drifted the moment the palette moved; this one cannot.
 *
 * The prose is authored here. The numbers — every hex, every OKLCH, the contract's worst cells,
 * the modifier ratios — are interpolated from the same config and measurement code the page uses.
 */
import {
	dark,
	ladderSpan,
	light,
	lightLadderSpan,
	markEars,
	modifiers,
	tokenName,
	type SwatchName,
	type ThemeName
} from '$lib/brand/config/palette';
import {
	cottontailOnShades,
	exportFormats,
	formatOklch,
	measureContract,
	modifierRatio,
	varName,
	type ContractCell
} from '$lib/brand/tokens';
import { hueEvidence } from '$lib/brand/config/light-story';
import { faces } from '$lib/brand/config/typography';
import { contrastRatio, parseColor } from '$lib/color';

export const prerender = true;

const names = Object.keys(dark) as SwatchName[];

/** The dark table's fourth column: what each token is, in the reader's terms. */
const ROLE: Record<SwatchName, string> = {
	background_lightest: 'surface ladder, +span',
	background_lighter: '+2/3 span',
	background_light: '+1/3 span',
	background: '**the seed** — the page',
	background_dark: '−1/3 span',
	background_darker: '−2/3 span',
	background_darkest: '−span',
	foreground: 'all body copy',
	tertiary: 'brand, rank 1',
	secondary: 'brand, rank 2',
	primary: 'brand, rank 3',
	accent: 'brand, rank 4',
	cottontail: 'identity — badge ink only',
	success: 'state',
	warning: 'state',
	error: 'state',
	info: 'state'
};

const r2 = (n: number) => n.toFixed(2);
const r3 = (n: number) => n.toFixed(3);

function darkTable(): string {
	const rows = names.map((name) => {
		const c = dark[name];
		return `| \`${name}\` | \`${c.hex}\` | \`${formatOklch(c)}\` | ${ROLE[name]} |`;
	});
	return ['| token | hex | oklch | what it is |', '|---|---|---|---|', ...rows].join('\n');
}

function lightTable(): string {
	const rows = names.map((name) => {
		const c = light[name];
		const oklch = `\`${formatOklch(c)}\`${name === 'background' ? ' — the page' : ''}`;
		return `| \`${name}\` | \`${c.hex}\` | ${oklch} |`;
	});
	return ['| token (`light_*` in the scheme) | hex | oklch |', '|---|---|---|', ...rows].join('\n');
}

function contractLine(theme: ThemeName): string {
	const c = measureContract(theme);
	const cell = (x: ContractCell) =>
		`**${r3(x.ratio)}** (\`${tokenName(x.on, theme)}\` on \`${tokenName(x.shade, theme)}\`)`;
	const verdict = c.holds ? `${c.count}/${c.count}` : 'CONTRACT BROKEN';
	const form = c.allAA ? ', every pair AA' : '';
	return `- ${theme}: ${verdict}${form} — text ${cell(c.text)}, colour on page/surface ${cell(c.legible)}, floor below ${cell(c.floor)}`;
}

function body(): string {
	const white = parseColor('#ffffff', 'white');
	const brandNames = ['tertiary', 'secondary', 'primary', 'accent'] as const;
	const inkOnBrand = brandNames.map((n) => contrastRatio(dark.background, dark[n]));
	const lightCt = cottontailOnShades('light');

	return `# lilBunnyRabbit — brand & theme

> A two-mode colour system generated from one seed, plus the mark, the type and the rules for
> using them. Take what you need. Guide: https://lilbunnyrabbit.github.io/brand/

Everything below is the whole system. If you are answering a question about these colours, or
generating code that uses them, this file is enough — you do not need to scrape the page.

The palette is authored in [Chromatics](https://lilbunnyrabbit.github.io/chromatics/), stored in
OKLCH, and shipped as hex. All solving happens in Chromatics; the values are transcribed into
\`src/lib/brand/config/palette.dark.ts\` and \`palette.light.ts\` in
https://github.com/lilBunnyRabbit/brand, and this file is generated from them at build time.

## The two modes

**Dark is the brand. Light is product UI only.** Marketing, social cards, the app icon and
anything doing brand recognition are always dark. Light exists so a product surface can render
light; it is not an identity palette and it is not a second brand.

Both modes carry **the same ${names.length} token keys**. Nothing rebinds between them — switching mode is a
scope change, not a remapping. In CSS that is \`[data-theme='light']\` on any element; dark sits on
\`:root\`, so the canonical mode needs no attribute and no JavaScript.

\`\`\`css
:root, [data-theme='dark'] { /* the ${names.length} --brand-* values, dark */ }
[data-theme='light']       { /* the same ${names.length} keys, light values */ }
\`\`\`

Every token is a custom property named \`--brand-<key>\`, e.g. \`${varName('primary')}\`,
\`${varName('background_lightest')}\`.

**The token keys are snake_case, the custom properties are kebab-case.** The keys below are
identifiers — Chromatics DSL variables and object keys, which cannot hold a hyphen — so the table
says \`background_lightest\` while the stylesheet says \`${varName('background_lightest')}\`. Convert
underscores to hyphens at the CSS boundary and nowhere else. Same for the Tailwind utilities:
\`bg-background-lightest\`, \`text-mark-ears\`.

## Dark — the brand palette

All ${names.length} derived from one literal, the seed \`${formatOklch(dark.background)}\`. Nothing is hand-picked.

${darkTable()}

The ladder is symmetric, ±${ladderSpan} lightness — solved, not chosen: the lightest shade is the seed lifted
to exactly where the dimmest rail colour still clears 4.55 (AA plus rounding headroom). Chroma moves in
proportion to lightness so lighter shades read as elevated. Hue is identity and chroma is rank: the
seed's chroma \`c\` is the quantum and every brand rank is an integer multiple of it (1c, 2c, 3c, 4c),
with states at 6c. 5c is deliberately empty so the brand band and the state band stay apart.

## Light — the product UI twin

Same keys, same jobs. Every value is a relationship to the dark seed or a solve against the contract,
but the solving lives in Chromatics (a luminance inversion for the text, the brand and the ladder;
the sRGB chroma ceiling at every rung; a gamut map for three states), so they ship as resolved literals.

${lightTable()}

Four things about light that are easy to get wrong:

- **The light primary is orange, not green.** Carry the page hue down to the brand's lightness and
  measure: dark's green sits ${hueEvidence.green} ΔE from that darkened form — a shade of the paper rather than a
  colour on it. Orange measures ${hueEvidence.orange}, and it is the seed's complement. Light is fitted to its own
  ground, it does not inherit dark's wheel.
- **The brand sits above the text.** Text is L ${light.foreground.l}, solved to an 8:1 body ratio; brand and states
  share L ${light.primary.l}, solved so the loudest of them still clears AA on the surface. See the contract below.
- **\`cottontail\` changes job.** In dark it is the badge ink. In light it is a UI colour — focus
  ring, marker, chart highlight. Never text (${r2(lightCt.min)}–${r2(lightCt.max)} across the shades), never the logo.
- **The ladder is asymmetric**: ${lightLadderSpan.up} up, ${lightLadderSpan.down} down. Up ends at a wall, not at the
  contract: white, where the sRGB chroma ceiling is zero, so \`background_lightest\` is
  \`${light.background_lightest.hex}\` by arithmetic rather than by choice. Down is solved the way dark's reach is — the
  ladder descends until the text still reads 4.55. Every rung holds the same gamut fraction of the
  chroma sRGB allows at its own lightness.

## One fixed colour

\`${markEars.name}\` \`${markEars.hex}\` \`${formatOklch(markEars)}\` — the mark's pale ears. Byte-identical in both
modes — dark's \`cottontail\` pinned. Only the disc themes. Deriving light ears from \`light_primary\`
gives ${r2(contrastRatio(light.cottontail, light.primary))} on the disc against ${r2(contrastRatio(markEars, light.primary))} for this, and they vanish under greyscale.

## The contrast contract

The 9 rail colours (\`foreground\`, the 4 brand, the 4 states) against the 7 shades — 63 pairs per
mode. The contract splits by role: **the text clears WCAG AA (4.5:1) on every shade; brand and
state colours clear AA on the page and the surface (\`background_dark\`) and WCAG's 3:1 non-text
floor on every rung below.** Dark meets the stronger form — every pair AA — for free.

${contractLine('dark')}
${contractLine('light')}

The practical consequence: **any shade can back body text, and the page and the surface can back
anything.** \`cottontail\` is excluded — it is an identity colour and makes no contract claim.

The contract is solved and verified in Chromatics; the guide measures it live on the page, and
this file's numbers above are measured from the shipped values at build time.

## Modifiers — opacity, never a new colour

Interaction and de-emphasis are alpha on an existing colour. Composited in gamma sRGB
(\`color-mix(in srgb, …)\`), which is what a browser actually paints.

| name | alpha | notes |
|---|---|---|
| \`hover\` | ${modifiers.hover} | |
| \`active\` | ${modifiers.active} | |
| \`muted\` | ${modifiers.muted} | AA-large at best — captions and metadata only, not on the lightest two shades |
| \`disabled\` | ${modifiers.disabled} | ${r2(modifierRatio('foreground', 'background', 'disabled'))}:1. Legally exempt, never for anything informational |
| \`border\` | ${modifiers.border} | the lowest alpha clearing 3:1 on **every** shade |

Available pre-composited as \`--fg-muted\`, \`--fg-disabled\`, \`--fg-border\`, and as \`--alpha-*\`.

## Rules

Hard don'ts:

1. **Light mode is UI only.** Never for brand recognition, marketing, the app icon or social cards.
2. **Nothing from the dark palette on white.** Dark's colours vanish there — primary is ${r2(contrastRatio(dark.primary, white))}:1,
   cottontail ${r2(contrastRatio(dark.cottontail, white))}:1. White is the top rung of the LIGHT ladder (\`${light.background_lightest.hex}\`, where the tint
   runs out) and the light palette is what goes on it; the light page itself is \`${light.background.hex}\`, a cream.
3. **No two brand colours adjacent or layered.** They are all the same lightness, so side by side
   they blur into one shape. A gap or a border fixes it.
4. **No gradients between brand colours.** Same lightness means the gradient has nowhere to travel
   and comes out muddy. Between two shades is fine.
5. **No white text on a brand fill.** White on primary is ${r2(contrastRatio(white, dark.primary))}:1. Use \`${dark.background.hex}\` and you get
   ${r2(Math.min(...inkOnBrand))}–${r2(Math.max(...inkOnBrand))}.
6. **Do not add colours.** Whatever seems to be missing is either a shade or an existing colour
   turned down.
7. **Do not re-tint the greys.** The backgrounds are blue and the brand is green on purpose.
8. **Do not "fix" the logo's contrast.** The bright badge is ${r2(contrastRatio(dark.cottontail, dark.primary))}:1 deliberately. Logos are exempt
   (WCAG 1.4.3, 1.4.11). No stroke, no shadow, no lighter green.

Take care:

- **No more than three shades per viewport.** Neighbours are ~${r2(contrastRatio(dark.background_light, dark.background))}:1 apart, so a fourth stops
  reading as structure.
- **Muted text is for captions, not content.** At ${Math.round(modifiers.muted * 100)}% it is ${r2(modifierRatio('foreground', 'background', 'muted'))}:1 on the page and ${r2(modifierRatio('foreground', 'background_lightest', 'muted'))} on the
  lightest shade.

## Typography

| face | CSS var | role | weights | licence |
|---|---|---|---|---|
${faces
	.map(
		(f) =>
			`| ${f.name} | \`${f.cssVar}\` | ${f.role.replace(/\.$/, '')} | ${f.weights.join(' ')} | ${f.licence} |`
	)
	.join('\n')}

Both self-hosted. There is no published size ladder — \`--text-*\` exists in the stylesheet but the
steps are an implementation detail, not a brand rule.

## Getting the palette

The guide offers the whole thing in ${exportFormats.length} formats, both modes in each, with the derivation formula
per colour:

${exportFormats
	.map((f) => {
		const notes: Record<string, string> = {
			css: '**CSS** custom properties',
			tailwind: '**Tailwind v4** `@theme` — usable as `bg-background`, `text-primary`, …',
			json: '**JSON** — hex + oklch + rgb + formula per token',
			markdown: '**Markdown**'
		};
		return `- ${notes[f.id] ?? `**${f.label}**`} — \`${f.filename}\``;
	})
	.join('\n')}

All ${exportFormats.length === 4 ? 'four' : exportFormats.length} are on https://lilbunnyrabbit.github.io/brand/#assets, along with the logo SVGs.

## Links

- [Brand guide](https://lilbunnyrabbit.github.io/brand/) — the whole thing, one page
- [Source](https://github.com/lilBunnyRabbit/brand) — the palette is config, the page renders it
- [Logo SVGs](https://github.com/lilBunnyRabbit/brand/tree/master/src/lib/brand/logos)
- [Chromatics](https://lilbunnyrabbit.github.io/chromatics/) — the tool the palette is authored in
- [GitHub](https://github.com/lilBunnyRabbit)

_Generated at build time from \`config/palette.dark.ts\` / \`palette.light.ts\` — the same source the
page renders. This file cannot drift from the guide._
`;
}

export function GET(): Response {
	return new Response(body(), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
