<script lang="ts">
	import { generations, pipRanks } from '$lib/brand/derivation';
	import { swatches } from '$lib/brand/config/palette';
	import { isShade } from '$lib/brand/config/palette';
	import { varName } from '$lib/brand/tokens';

	/*
		The derivation as a recipe, not a scatter.

		A true chroma × lightness plot of these 17 colours wastes most of its canvas: they cluster into
		a ladder low down and a rail across the middle, so seven shades get squeezed into a fifth of the
		height while two thirds of the panel sits empty, labels collide, and the connecting arcs sweep
		through nothing. Coordinate fidelity cost more than it bought.

		So: reading order instead. Four generations, each a list of moves. Every row shows the parent
		swatch, the child swatch, and the operation between them — the reference is the row itself. The
		pips are chroma in whole seeds, which is where the arithmetic becomes visible: 1, 2, 3, 4, then
		6, and nothing at 5.

		Nothing is positioned by hand and nothing can overlap, because it is all flow layout.
	*/

	/** Text that sits on a swatch: foreground on a shade, background on anything else. */
	const inkFor = (name: string) => `var(${varName(isShade(name) ? 'foreground' : 'background')})`;
</script>

<div class="tree">
	{#each generations as gen (gen.gen)}
		<section class="gen">
			<header>
				<p class="gen-n">{String(gen.gen).padStart(2, '0')}</p>
				<h4>{gen.title}</h4>
				<p class="gen-blurb">{gen.blurb}</p>
			</header>

			<ul>
				{#each gen.steps as step (step.name)}
					<li>
						{#if step.parent}
							<span
								class="from"
								style="background: var({varName(step.parent)});"
								title={step.parent}
								aria-hidden="true"
							></span>
							<span class="arrow" aria-hidden="true">→</span>
						{:else}
							<span class="from is-none" aria-hidden="true"></span>
							<span class="arrow" aria-hidden="true"></span>
						{/if}

						<span
							class="chip"
							style="background: var({varName(step.name)}); color: {inkFor(step.name)};"
						>
							<span class="chip-name">{step.name}</span>
							<span class="chip-hex">{swatches[step.name].hex}</span>
						</span>

						<span class="op">{step.op}</span>

						<span class="pips" aria-hidden="true">
							{#if step.pips !== null}
								{#each Array(step.pips) as _, i (i)}
									<span class="pip"></span>
								{/each}
							{/if}
						</span>

						<span class="sr-only">
							{step.name}, {swatches[step.name].hex}.
							{#if step.parent}From {step.parent}, {step.op}.{:else}{step.op}.{/if}
							{#if step.pips !== null}Chroma {step.pips} seeds.{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<p class="legend">
		<span class="pips" aria-hidden="true">
			{#each pipRanks as rank (rank)}
				<span class="pip"></span>
			{/each}
		</span>
		Each pip is one seed of chroma. The ranks that exist are {pipRanks.join(', ')} — there is nothing
		at 5, and nothing at 7 because sRGB runs out first.
	</p>
</div>

<style>
	.tree {
		display: grid;
		gap: clamp(var(--space-5), 4vw, var(--space-6));
	}

	.gen header {
		margin-bottom: var(--space-4);
	}

	.gen-n {
		margin: 0 0 var(--space-1);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--brand-secondary);
	}

	h4 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.gen-blurb {
		max-width: 62ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	ul {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 1.25rem 1rem minmax(0, 1fr) minmax(0, 1.1fr) auto;
		gap: var(--space-3);
		align-items: center;
	}

	/* The parent, as a colour rather than a name — so the reference is visible, not written. */
	.from {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: var(--radius-sm);
	}

	.is-none {
		border: 1px dashed var(--hairline);
	}

	.arrow {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--fg-muted);
		text-align: center;
	}

	.chip {
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--space-3);
		align-items: baseline;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
	}

	.chip-name {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.chip-hex {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		opacity: 0.75;
	}

	.op {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.pips {
		display: flex;
		gap: 3px;
		align-items: center;
	}

	.pip {
		width: 5px;
		height: 5px;
		background: var(--brand-primary);
		border-radius: 50%;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
		max-width: 70ch;
		margin: 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (max-width: 700px) {
		li {
			grid-template-columns: 1.25rem 1rem minmax(0, 1fr);
			gap: var(--space-2) var(--space-3);
		}

		.op {
			grid-column: 3;
		}

		.pips {
			grid-column: 3;
		}
	}
</style>
