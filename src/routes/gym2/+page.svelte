<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import { clamp, createBoundPoints, denormalize, isInsidePoly, normalize, Vec2D } from '$lib/utils'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Target from './Target.svelte'
	import Creature from './Creature.svelte'
	import Network from '$lib/Viz/Network.svelte'
	import { Brain } from '$lib/KAN/Brain'

	export let w = 1000
	export let h = 600

	let simulate = true
	let seeAll = false

	const POPULATION_SIZE = 30
	const TARGET_POSITIONS = [
		[w / 2, h / 2],
		[100, 100],
		[100, h - 100],
		[w - 100, 100],
		[w - 100, h - 100]
	] as const
	class Spider {
		brain: Brain
		pos: Vec2D
		spiderBound: Vec2D[]
		targetIndex = 0
		target: Vec2D
		targetBound: Vec2D[]
		maxSpeed = 6
		speed: number
		fitness = 0

		constructor(b: Brain) {
			this.brain = b
			this.pos = new Vec2D(50, 50)
			this.pos.direccion = randomNumber(0, 360)
			this.spiderBound = createBoundPoints(8, this.pos, 30)
			this.target = new Vec2D(
				TARGET_POSITIONS[this.targetIndex][0],
				TARGET_POSITIONS[this.targetIndex][1]
			)
			this.targetBound = createBoundPoints(4, this.target, 25)
			this.speed = randomNumber(0, this.maxSpeed)
		}

		seek() {
			const inputs = [
				this.pos.angleTo(this.target),
				this.pos.distanceTo(this.target),
				this.speed,
				this.pos.direccion
			]
			const minI = min(inputs)
			const maxI = max(inputs)
			const normalized = inputs.map((n) => linearScale(n, minI, maxI, 0, 1))
			const out = this.brain.forward(normalized)

			const direction = linearScale(out[0], 0, 1, 0, 360)
			this.speed = linearScale(out[1], 0, 1, 0, this.maxSpeed)

			this.pos.direccion = direction
			this.pos.forward(this.speed)

			const marging = 30
			this.pos.clamp(marging, w - marging, marging, h - marging)

			this.spiderBound = createBoundPoints(8, this.pos, marging)

			this.updateFitness()
		}

		updateTarget() {
			if (TARGET_POSITIONS[this.targetIndex + 1]) this.targetIndex++
			else this.targetIndex = 0
			this.target = new Vec2D(
				TARGET_POSITIONS[this.targetIndex][0],
				TARGET_POSITIONS[this.targetIndex][1]
			)
			this.targetBound = createBoundPoints(4, this.target, 25)
		}

		updateFitness() {
			let fit = 0
			if (isInsidePoly(this.spiderBound, this.targetBound)) {
				fit += 1
				this.updateTarget()
			} else {
				const distance = Math.pow(this.pos.distanceTo(this.target), 2)
				fit += 7 / (1 + distance)
			}

			this.fitness += fit
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
	let EVOLUTION_INTERVAL = 400
	function update() {
		frames++
		if (simulate) {
			// if (EVOLUTION_INTERVAL < 1000 && frames % 6000 === 0) EVOLUTION_INTERVAL += 10
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = simulation.population[i]
			})
		}
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
	<p>best fitness: {simulation.population[0].fitness}</p>
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
	<div class="enviroment s-6">
		{#if seeAll}
			{#each simulation.population as spider, i}
				<Creature color="oklab({spider.fitness * 0.005} -0.04 -0.12 / 1)" pos={spider.pos}
				></Creature>
			{/each}
		{:else}
			{@const spider1 = simulation.population[0]}
			<Creature color="oklab({spider1.fitness * 0.005} -0.04 -0.12 / 1)" pos={spider1.pos}
			></Creature>
			<Target pos={spider1.target}></Target>
		{/if}
	</div>

	<Network network={simulation.population[0].brain}></Network>
</div>

<style>
	.wrapper {
		--md-columns: 1000px 1fr;
	}
	.enviroment {
		position: relative;
		width: 1000px;
		height: 600px;
	}
</style>
