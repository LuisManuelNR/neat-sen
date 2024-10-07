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
	const target = new GameObject()
	target.x = w - 100
	target.y = 100
	class Spider extends GameObject {
		brain: Brain
		fitness = 0
		speed = 0
		prevDistance = 0
		inputs: number[]
		outputs: number[]
		score = 0

		constructor(b: Brain) {
			super()
			this.brain = b
			this.x = 100
			this.y = 100
			this.inputs = []
			this.outputs = []
		}

		seek() {
			this.inputs = [
				// this.x / w,
				// this.y / h,
				// target.x / w,
				// target.y / h,
				this.speed / MAX_SPEED,
				// this.angle / (Math.PI * 2),
				this.distanceTo(target) / w,
				this.angleTo(target) / (Math.PI * 2)
			]

			this.outputs = this.brain.forward(this.inputs)

			this.speed = linearScale(this.outputs[0], 0, 1, 0, MAX_SPEED)
			this.angle = linearScale(this.outputs[1], 0, 1, -Math.PI, Math.PI)

			this.x = clamp(this.x, 0, w)
			this.y = clamp(this.y, 0, h)

			this.forward(this.speed)
		}

		train() {
			this.seek()
			this.updateFitness()
		}

		updateFitness() {
			const distance = this.distanceTo(target)
			if (distance < this.prevDistance) {
				// this.fitness += 1 / (1 + distance)
				this.fitness++
			} else if (distance > this.prevDistance) {
				// this.fitness -= 1 / (1 + distance)
				this.fitness--
			}
			this.prevDistance = distance
		}
	}

	function updateTarget() {
		target.x = w - 100
		target.y += Math.sin(frames * 0.02) * 4.5
	}

	const simulation = new Simulation({
		inputs: 3,
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
		updateTarget()
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
		{/if}
		<GameObjectComponent go={target}>
			<div class="target brand"></div>
		</GameObjectComponent>
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
