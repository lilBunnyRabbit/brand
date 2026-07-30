<script lang="ts">
	import { onDestroy } from 'svelte';
	import { growSteps, lastStage, stages, waveDuration } from '$lib/brand/derivation';
	import { isShade } from '$lib/brand/config/palette';
	import { varName } from '$lib/brand/tokens';

	/*
		Watch one colour become seventeen.

		Three things animate at once, and each one is a channel of the formula rather than decoration:

		  colour   --l/--c/--h are registered with @property (app.css), so a transition interpolates
		           them as NUMBERS. Every chip travels through real OKLCH space along the same channels
		           the palette is defined in — not a cross-fade between two hexes.
		  notch    a bar that rotates from the seed's hue to its own, so a hue turn is a turn.
		  pips     one per seed of chroma, popping in after the colour lands. You see x1 become x6, and
		           you see that nothing ever reaches five.

		Chips also emerge from the seed's position, so each generation looks like it came out of the one
		before rather than fading in beside it.

		SSR renders the finished grid at full stage, so with JavaScript off this is simply the correct
		palette with its formulas. The sequence is enhancement.
	*/

	let stage = $state(lastStage);
	let playing = $state(false);
	let seeding = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const inkFor = (name: string) => `var(${varName(isShade(name) ? 'foreground' : 'background')})`;

	function clear() {
		if (timer) clearTimeout(timer);
		timer = undefined;
	}

	/** Hold everything at the seed with transitions off, then release on the next frame. */
	function reset(): Promise<void> {
		return new Promise((resolve) => {
			seeding = true;
			stage = 0;
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					seeding = false;
					resolve();
				})
			);
		});
	}

	function advance() {
		clear();
		if (stage >= lastStage) {
			playing = false;
			return;
		}
		timer = setTimeout(
			() => {
				stage += 1;
				advance();
			},
			waveDuration * 1000 + 550
		);
	}

	async function play() {
		clear();
		playing = true;
		await reset();
		advance();
	}

	function pause() {
		clear();
		playing = false;
	}

	function goTo(next: number) {
		clear();
		playing = false;
		stage = next;
	}

	onDestroy(clear);

	// Runs in the browser only, so the server keeps the finished grid.
	$effect(() => {
		play();
	});

	const current = $derived(stages[stage]);
	const shown = $derived(growSteps.filter((s) => s.gen <= stage));
	const revealed = $derived(shown.length);
</script>

<div class="grow" class:is-seeding={seeding}>
	<div class="stagebar">
		<div class="controls">
			{#if playing}
				<button type="button" class="run" onclick={pause}>
					<span class="glyph" aria-hidden="true">❚❚</span> Pause
				</button>
			{:else}
				<button type="button" class="run" onclick={play}>
					<span class="glyph" aria-hidden="true">▶</span>
					{stage === lastStage ? 'Again' : 'Play'}
				</button>
			{/if}

			<div class="dots" role="group" aria-label="Stage">
				{#each stages as s, i (s.gen)}
					<button
						type="button"
						class="dot"
						class:is-on={i <= stage}
						class:is-here={i === stage}
						aria-label="Stage {i + 1}: {s.kicker}"
						aria-current={i === stage ? 'step' : undefined}
						onclick={() => goTo(i)}
					></button>
				{/each}
			</div>

			<p class="count" aria-live="off">{revealed} / {growSteps.length}</p>
		</div>

		<!-- The narration. One beat per stage, so it reads as a sequence rather than a grid. -->
		<div class="narration">
			<p class="kicker">{current.kicker}</p>
			<p class="line">{current.line}</p>
		</div>
	</div>

	<ul class="chips">
		{#each growSteps as step (step.name)}
			{@const on = step.gen <= stage}
			<li
				class:is-on={on}
				class:is-seed={step.name === 'background'}
				style="--to-l: {step.l}; --to-c: {step.c}; --to-h: {step.h}deg; --delay: {step.delay}s; --dur: {step.duration}s;"
				aria-hidden={on ? undefined : 'true'}
			>
				<span class="face" style="color: {inkFor(step.name)};">
					<span class="notch" aria-hidden="true"></span>
					<span class="meta">
						<span class="name">{step.name}</span>
						<span class="op">{step.op}</span>
					</span>
					<span class="pips" aria-hidden="true">
						{#if step.pips !== null}
							{#each Array(step.pips) as _, i (i)}
								<span class="pip" style="--pip-delay: {step.delay + 0.55 + i * 0.07}s;"></span>
							{/each}
						{/if}
					</span>
				</span>
				{#if on}
					<span class="sr-only">
						{step.name}, {step.hex}.
						{#if step.parent}From {step.parent}, {step.op}.{:else}{step.op}.{/if}
						{#if step.pips !== null}Chroma {step.pips} seeds.{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.grow {
		display: grid;
		gap: clamp(var(--space-5), 4vw, var(--space-6));
	}

	/* ── controls and narration ── */
	.stagebar {
		display: grid;
		gap: var(--space-4);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		align-items: center;
	}

	.run {
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		min-width: 6.5rem;
		padding: var(--space-2) var(--space-4);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--on-brand);
		cursor: pointer;
		background: var(--brand-primary);
		border: 0;
		border-radius: var(--radius-pill);
	}

	.run:hover {
		background: color-mix(in srgb, var(--brand-primary) 85%, transparent);
	}

	.glyph {
		font-size: 0.7em;
	}

	.dots {
		display: flex;
		gap: var(--space-2);
	}

	.dot {
		width: 2.25rem;
		height: 4px;
		padding: 0;
		cursor: pointer;
		background: var(--brand-bg_lightest);
		border: 0;
		border-radius: var(--radius-pill);
		transition: background var(--dur-fast) var(--ease);
	}

	.dot.is-on {
		background: var(--brand-secondary);
	}

	/* Current stage is the loud one, and it is wider — not colour alone. */
	.dot.is-here {
		width: 3.25rem;
		background: var(--brand-primary);
	}

	.count {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.narration {
		min-height: 4.5rem;
	}

	.kicker {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--brand-primary);
	}

	.line {
		max-width: 62ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	/* ── the chips ── */
	.chips {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
		gap: var(--space-3);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	/*
		A chip holds its own channel targets. Colour travels via a transition on the registered
		properties; the chip itself scales up out of the seed at the same time.
	*/
	li {
		--l: var(--to-l);
		--c: var(--to-c);
		--h: var(--to-h);

		/*
			The background lives HERE, on the element that owns the channel vars. `@property` registers
			them with `inherits: false`, so a child cannot read them — putting the paint on `.face` left
			every chip resolving to the initial (seed) values forever.
		*/
		background: oklch(var(--l) var(--c) var(--h));
		border-radius: var(--radius-md);
		opacity: 0;
		transform: scale(0.72);
		transition:
			--l var(--dur) var(--ease) var(--delay),
			--c var(--dur) var(--ease) var(--delay),
			--h var(--dur) var(--ease) var(--delay),
			opacity 0.45s var(--ease) var(--delay),
			transform 0.65s var(--ease-spring, var(--ease)) var(--delay);
	}

	li.is-on {
		opacity: 1;
		transform: none;
	}

	/* The seed is the origin: always present, and it never travels. */
	li.is-seed {
		outline: 2px solid var(--brand-primary);
		outline-offset: 3px;
	}

	.face {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		height: 100%;
		padding: var(--space-3);
	}

	/* Held at the seed with transitions off, so the next frame travels out of it. */
	.is-seeding li {
		--l: 0.255;
		--c: 0.0233;
		--h: 230.47deg;

		transition: none;
	}

	.is-seeding .notch {
		transition: none;
	}

	/* The hue, as a rotation. It turns as the colour turns. */
	.notch {
		display: block;
		width: 2px;
		height: 1.1rem;
		background: currentColor;
		opacity: 0.65;
		transform-origin: 50% 100%;
		transform: rotate(var(--to-h));
		transition: transform var(--dur) var(--ease) var(--delay);
	}

	.is-seeding .notch {
		transform: rotate(230.47deg);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-top: auto;
	}

	.name {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.op {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		opacity: 0.8;
	}

	.pips {
		display: flex;
		gap: 3px;
		align-items: center;
		min-height: 6px;
	}

	/* One pip per seed of chroma, popping in after the colour lands. */
	.pip {
		width: 6px;
		height: 6px;
		background: currentColor;
		border-radius: 50%;
		opacity: 0.9;
		transform: scale(1);
		transition: transform 0.3s var(--ease) var(--pip-delay);
	}

	.is-seeding .pip {
		transform: scale(0);
		transition: none;
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

	@media (max-width: 720px) {
		.controls {
			gap: var(--space-3);
		}

		.dot {
			width: 1.75rem;
		}

		.dot.is-here {
			width: 2.5rem;
		}

		.narration {
			min-height: 5.5rem;
		}
	}

	/* Nothing travels: every chip is simply itself. The controls stay, so it is still steppable. */
	@media (prefers-reduced-motion: reduce) {
		li,
		.is-seeding li {
			--l: var(--to-l);
			--c: var(--to-c);
			--h: var(--to-h);

			transform: none;
			transition: none;
		}

		.notch,
		.is-seeding .notch {
			transform: rotate(var(--to-h));
			transition: none;
		}

		.pip,
		.is-seeding .pip {
			transform: scale(1);
			transition: none;
		}
	}
</style>
