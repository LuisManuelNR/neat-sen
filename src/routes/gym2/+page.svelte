<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import {
		clamp,
		createBoundPoints,
		denormalize,
		isInsidePoly,
		normalize,
		randomGaussian,
		Vec2D
	} from '$lib/utils'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Network from '$lib/Viz/Network.svelte'
	import { Brain } from '$lib/KAN/Brain'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'

	let w = 1000
	let h = 600

	let simulate = true
	let seeAll = false

	const POPULATION_SIZE = 50
	const MAX_SPEED = 6

	class Spider extends GameObject {
		brain: Brain
		fitness = 0
		speed = 0
		prevDistance: number
		inputs: number[]
		outputs: number[]
		target = new GameObject()
		score = 0

		constructor(b: Brain) {
			super()
			this.brain = b
			this.x = 100
			this.y = 100
			this.target.x = w - 100
			this.target.y = h - 100
			this.prevDistance = this.distanceTo(this.target)
			this.inputs = []
			this.outputs = []
		}

		seek() {
			// this.inputs = [this.x, this.y, target.x, target.y, this.speed, this.angle]
			// const minI = min(this.inputs)
			// const maxI = max(this.inputs)
			// const normalized = this.inputs.map((n) => linearScale(n, minI, maxI, 0, 1))
			this.inputs = [
				// this.x / w,
				// this.y / h,
				// this.target.x / w,
				// this.target.y / h,
				// this.speed / MAX_SPEED,
				// this.angle / (Math.PI * 2),
				this.distanceTo(this.target) / w,
				this.angleTo(this.target) / (Math.PI * 2)
			]
			// this.inputs = this.inputs.map((n) => clamp(n, 0, 1))
			this.outputs = this.brain.forward(this.inputs)
			// this.speed = clamp(this.outputs[0], 0, MAX_SPEED)
			// this.angle = clamp(this.outputs[1], 0, Math.PI * 2)
			this.speed = this.outputs[0]
			this.angle = this.outputs[1]

			this.forward(this.speed)

			this.x = clamp(this.x, 0, w)
			this.y = clamp(this.y, 0, h)
		}

		train() {
			this.seek()
			this.updateFitness()
		}

		updateFitness() {
			const distance = this.distanceTo(this.target)
			if (distance < 10) {
				this.updateTarget()
				this.score++
			}
			if (distance < this.prevDistance) {
				this.fitness += 1 / (1 + distance)
			} else if (distance > this.prevDistance) {
				this.fitness -= 1 / (1 + distance)
			}
			this.prevDistance = distance
		}

		updateTarget() {
			this.target.x = randomNumber(50, w - 100)
			this.target.y = randomNumber(50, h - 100)
		}
	}

	const simulation = new Simulation({
		inputs: 2,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let EVOLUTION_INTERVAL = 200
	function update() {
		frames++
		if (simulate) {
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
			}
			simulation.population.forEach((s, i) => {
				s.train()
				simulation.population[i] = simulation.population[i]
			})
		} else {
			simulation.population[0].seek()
			simulation.population[0] = simulation.population[0]
		}
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
	{:else}
		<button class="btn success" on:click={() => (simulate = true)}> evolve </button>
	{/if}
	<CLabel label="See all">
		<input type="checkbox" bind:checked={seeAll} />
	</CLabel>
	<p>generations: {generations}</p>
	<p>best fitness: {simulation.population[0].fitness}</p>
	<p>frames to evolve: {EVOLUTION_INTERVAL}</p>
</div>

<div class="wrapper d-grid gap-2">
	<div class="enviroment s-6">
		{#if seeAll}
			{#each simulation.population as spider}
				<SpiderComponent go={spider} color="oklab({spider.fitness} -0.04 -0.12 / 1)" />
			{/each}
		{:else}
			{@const spider = simulation.population[0]}
			<SpiderComponent go={spider} color="oklab({spider.fitness} -0.04 -0.12 / 1)" />
			<GameObjectComponent go={spider.target}>
				<div class="target brand">{spider.score}</div>
			</GameObjectComponent>
		{/if}
	</div>

	<Network
		inputs={simulation.population[0].inputs}
		outputs={simulation.population[0].outputs}
		network={simulation.population[0].brain}
	></Network>
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
	.target {
		display: grid;
		place-content: center;
	}
</style>
