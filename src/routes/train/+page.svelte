<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import { createBoundPoints, isInsidePoly, randomGaussian, Vec2D } from '$lib/utils'
	import { runOnFrames, linearScale, randomNumber } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Target from './Target.svelte'
	import Creature from './Creature.svelte'
	import Network from '$lib/Viz/Network.svelte'
	import Bounding from './Bounding.svelte'
	import { Brain } from '$lib/KAN/Brain'
	// import type { Brain } from '$lib/TOY-MLP/Brain'

	export let w = 600
	export let h = 600

	let simulate = true
	let seeAll = true

	const POPULATION_SIZE = 50
	const TURN_RATE = 10

	class Spider {
		pos: Vec2D = new Vec2D(300, 0)
		target: Vec2D = new Vec2D(300, 550)
		dir = 0
		brain: Brain
		spiderBound: Vec2D[]
		targetBound: Vec2D[]
		maxSpeed = 6
		prevDistance: number = 0

		constructor(b: Brain) {
			this.brain = b
			this.spiderBound = createBoundPoints(8, this.pos, 30)
			this.targetBound = createBoundPoints(4, this.target, 25)
		}

		seek() {
			// const normalized = [
			// 	linearScale(this.pos.x, 0, w, -1, 1),
			// 	linearScale(this.pos.y, 0, w, -1, 1),
			// 	linearScale(this.target.x, 0, w, -1, 1),
			// 	linearScale(this.target.y, 0, w, -1, 1),
			// 	linearScale(this.dir, 0, 360, -1, 1),
			// 	linearScale(this.pos.degFromPoint(this.target), 0, 360, -1, 1)
			// ]

			const normalized = [
				linearScale(this.pos.x, 0, w, 0, 1),
				linearScale(this.pos.y, 0, w, 0, 1),
				linearScale(this.target.x, 0, w, 0, 1),
				linearScale(this.target.y, 0, w, 0, 1),
				linearScale(this.dir, 0, 360, 0, 1),
				linearScale(this.pos.degFromPoint(this.target), 0, 360, 0, 1)
			]

			// const normalized = [
			// 	Math.tanh(this.pos.x / w),
			// 	Math.tanh(this.pos.y / h),
			// 	Math.tanh(this.target.x / w),
			// 	Math.tanh(this.target.y / h),
			// 	Math.tanh(this.dir / 360),
			// 	Math.tanh(this.pos.degFromPoint(this.target) / 360)
			// ]

			this.brain.forward(normalized)

			const out = this.brain.outputs

			this.dir = linearScale(out[0], 0, 1, 0, 360)
			this.maxSpeed = linearScale(out[1], 0, 1, 0, 10)

			if (this.maxSpeed < 0) this.maxSpeed = 0

			const rad = (Math.PI / 180) * (this.dir - 90)
			this.pos.x += Math.cos(rad) * this.maxSpeed
			this.pos.y += Math.sin(rad) * this.maxSpeed

			this.spiderBound = createBoundPoints(8, this.pos, 30)

			// Actualizar fitness
			if (simulate && this !== bestSpider) {
				this.updateFitness()
			}
		}

		updateFitness() {
			let fit = 0
			const distance = this.pos.distanceTo(this.target)

			// Premiar la reducción en la distancia al objetivo
			if (distance < this.prevDistance) {
				fit += 1
			}

			// Penalizar si la araña se mueve lejos del objetivo
			if (distance > this.prevDistance) {
				fit -= 1
			}

			// Premiar la proximidad al objetivo
			fit += 1 / (1 + distance)

			if (isInsidePoly(this.spiderBound, this.targetBound)) {
				// this.target = new Vec2D(randomNumber(0, 600), 550)
				// this.targetBound = createBoundPoints(4, this.target, 25)
				fit += 1
			}

			this.brain.fitness += Math.pow(fit, 2)
			this.prevDistance = distance
		}
	}

	const simulation = new Simulation({
		inputs: 6,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let bestSpider = simulation.getBestIndividual()
	let evolutionInterval = 5
	function update() {
		frames++
		if (frames % 150 === 0 && evolutionInterval < 300) evolutionInterval++
		if (simulate) {
			if (frames % evolutionInterval === 0) {
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
		return runOnFrames(60, update)
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
	<p>best fitness: {bestSpider?.brain.fitness}</p>
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
