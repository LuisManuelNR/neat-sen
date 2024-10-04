<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import { clamp, createBoundPoints, denormalize, isInsidePoly, normalize, Vec2D } from '$lib/utils'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Target from './Target.svelte'
	import Creature from './Creature.svelte'
	import Network from '$lib/Viz/Network.svelte'
	import Bounding from './Bounding.svelte'
	import { Brain } from '$lib/KAN/Brain'

	export let w = 600
	export let h = 600

	let simulate = true
	let seeAll = false

	const POPULATION_SIZE = 50
	class Spider {
		pos: Vec2D = new Vec2D(20, 20)
		target: Vec2D = new Vec2D(w / 2, 500)
		brain: Brain
		spiderBound: Vec2D[]
		targetBound: Vec2D[]
		maxSpeed = 6
		fitness = 0

		constructor(b: Brain) {
			this.brain = b
			this.spiderBound = createBoundPoints(8, this.pos, 30)
			this.targetBound = createBoundPoints(4, this.target, 25)
		}

		seek() {
			const inputs = [this.pos.x, this.pos.y, this.target.x, this.target.y]
			const minI = min(inputs)
			const maxI = max(inputs)
			const normalized = inputs.map((n) => normalize(n, minI, maxI))

			const out = this.brain.forward(normalized)

			const direction = linearScale(out[0], 0, 1, 0, 360)
			const speed = linearScale(out[1], 0, 1, 0, this.maxSpeed)

			this.pos.direccion = direction
			this.pos.forward(speed)

			this.pos.x = clamp(this.pos.x, 0, w)
			this.pos.y = clamp(this.pos.y, 0, h)

			this.spiderBound = createBoundPoints(8, this.pos, 30)

			this.updateFitness()
		}

		updateFitness() {
			let fit = 0

			const distance = this.pos.distanceTo(this.target)
			const pd = Math.pow(distance, 2)
			fit += 1 / (1 + pd)

			this.fitness += fit

			if (this.fitness > 1 && isInsidePoly(this.spiderBound, this.targetBound)) {
				this.target.forward(400)
				this.target.direccion *= -1
				this.targetBound = createBoundPoints(4, this.target, 25)
				this.target = this.target
			}
		}
	}

	const simulation = new Simulation({
		inputs: 4,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let best = simulation.getBestIndividual()
	let EVOLUTION_INTERVAL = 100
	function update() {
		frames++
		if (simulate || generations >= 2000) {
			if (frames % 500 === 0) EVOLUTION_INTERVAL += 20
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				best = simulation.getBestIndividual()
			}
			simulation.population.forEach((s, i) => s.seek())
		}
		best.seek()
		best = best
	}

	function stopSimulation() {
		simulate = false
	}

	onMount(() => {
		return runOnFrames(120, update)
	})
</script>

<div>
	{#if simulate}
		<button class="btn error" on:click={stopSimulation}> pause </button>
		<CLabel label="See all">
			<input type="checkbox" bind:checked={seeAll} />
		</CLabel>
	{:else}
		<button class="btn success" on:click={() => (simulate = true)}> evolve </button>
	{/if}
	<p>generations: {generations}</p>
	<p>best fitness: {best.fitness}</p>
	<p>frames to evolve: {EVOLUTION_INTERVAL}</p>

	<!-- <input type="range" min="0" max="360" bind:value={bestSpider.pos.direccion} />
	<input
		type="range"
		min="0"
		max="360"
		on:input={() => {
			bestSpider.pos.forward(1)
			bestSpider = bestSpider
		}}
	/> -->
</div>

<div class="wrapper d-grid gap-2">
	<div class="enviroment s-6" style:width="{w}px" style:height="{h}px">
		<Target bind:pos={best.target}></Target>
		<Creature color="#9100ff" pos={best.pos}></Creature>
		<Bounding vertices={best.spiderBound}></Bounding>
		<Bounding vertices={best.targetBound}></Bounding>
	</div>

	<Network network={best.brain}></Network>
</div>

<style>
	.wrapper {
		--md-columns: 600px 1fr;
	}
	.enviroment {
		position: relative;
		width: 100%;
	}
</style>
