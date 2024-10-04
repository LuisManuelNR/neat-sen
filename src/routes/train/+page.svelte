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
	const TURN_RATE = 10

	const POPULATION_SIZE = 50
	class Spider {
		pos: Vec2D = new Vec2D(200, 0)
		target: Vec2D = new Vec2D(randomNumber(0, w), 500)
		dir = 0
		brain: Brain
		spiderBound: Vec2D[]
		targetBound: Vec2D[]
		maxSpeed = 6
		prevDistance: number = 0
		fitness = 0

		constructor(b: Brain) {
			this.brain = b
			this.spiderBound = createBoundPoints(8, this.pos, 30)
			this.targetBound = createBoundPoints(4, this.target, 25)
		}

		seek() {
			const inputs = [
				this.pos.x,
				this.pos.y,
				this.target.x,
				this.target.y,
				this.pos.degFromPoint(this.target)
			]
			const minI = min(inputs)
			const maxI = max(inputs)
			const normalized = inputs.map((n) => normalize(n, minI, maxI))
			this.brain.forward(normalized)

			const out = this.brain.outputs

			this.dir = linearScale(out[0], 0, 1, 0, 360)

			const rad = (Math.PI / 180) * (this.dir - 90)
			let speed = linearScale(out[1], 0, 1, 0, this.maxSpeed)

			this.pos.x += Math.cos(rad) * speed
			this.pos.y += Math.sin(rad) * speed

			this.pos.x = clamp(this.pos.x, 0, w)
			this.pos.y = clamp(this.pos.y, 0, h)

			this.spiderBound = createBoundPoints(8, this.pos, 30)

			this.updateFitness()
		}

		updateFitness() {
			let fit = 0

			if (isInsidePoly(this.spiderBound, this.targetBound)) {
				fit += 1
				this.target.x = randomNumber(0, w)
				this.target.y = this.target.y > 200 ? 200 : 550
				this.targetBound = createBoundPoints(4, this.target, 25)
			} else {
				const distance = this.pos.distanceTo(this.target)
				fit += 1 / (1 + distance)
			}

			this.fitness += fit
		}
	}

	const simulation = new Simulation({
		inputs: 5,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let bestSpider = simulation.getBestIndividual()
	let EVOLUTION_INTERVAL = 200
	function update() {
		frames++
		if (simulate || generations >= 1000) {
			if (frames % 2000 === 0) EVOLUTION_INTERVAL += 5
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				bestSpider = simulation.getBestIndividual()
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = simulation.population[i]
			})
		}
		bestSpider.seek()
		bestSpider = bestSpider
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
	<p>best fitness: {bestSpider?.fitness}</p>
	<p>frames to evolve: {EVOLUTION_INTERVAL}</p>
</div>

<div class="wrapper d-grid gap-2">
	<div class="enviroment s-6" style:width="{w}px" style:height="{h}px">
		{#if bestSpider}
			<Target bind:x={bestSpider.target.x} bind:y={bestSpider.target.y}></Target>
			<Creature color="#9100ff" x={bestSpider.pos.x} y={bestSpider.pos.y} direction={bestSpider.dir}
			></Creature>
			<Bounding vertices={bestSpider.spiderBound}></Bounding>
			<Bounding vertices={bestSpider.targetBound}></Bounding>
		{/if}
		{#if simulate && seeAll}
			{#each simulation.population as spider, i}
				<Creature x={spider.pos.x} y={spider.pos.y} direction={spider.dir}></Creature>
			{/each}
		{/if}
	</div>

	{#if bestSpider}
		<Network network={bestSpider.brain}></Network>
	{/if}
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
