<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import { clamp, createBoundPoints, denormalize, isInsidePoly, normalize, Vec2D } from '$lib/utils'
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

	const POPULATION_SIZE = 200
	const MAX_SPEED = 6
	const target = new GameObject()
	target.x = 50
	target.y = 50

	class Spider extends GameObject {
		brain: Brain
		fitness = 0
		speed = 0
		prevDistance: number

		constructor(b: Brain) {
			super()
			this.brain = b
			this.x = w - 100
			this.y = h - 100
			this.prevDistance = this.distanceTo(target)
		}

		seek() {
			const inputs = [this.x, this.y, target.x, target.y, this.angleTo(target)]
			const minI = min(inputs)
			const maxI = max(inputs)
			const normalized = inputs.map((n) => linearScale(n, minI, maxI, 0, 1))
			const out = this.brain.forward(normalized)

			this.speed = out[0] * MAX_SPEED
			this.angle = Math.PI * 2 * out[1]

			this.forward(this.speed)

			this.updateFitness()
		}

		updateFitness() {
			const distance = this.distanceTo(target)
			if (distance < this.prevDistance) {
				this.fitness += 1 / (1 + distance)
			} else if (distance > this.prevDistance) {
				this.fitness += 1 / (1 + distance)
			}
			this.prevDistance = distance
		}
	}

	function updateTarget() {
		target.x = randomNumber(50, w)
		target.y = randomNumber(50, h)
	}

	const simulation = new Simulation({
		inputs: 5,
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
			// if (EVOLUTION_INTERVAL < 1000 && frames % 6000 === 0) EVOLUTION_INTERVAL += 10
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = simulation.population[i]
			})
			if (frames % (EVOLUTION_INTERVAL * 10) === 0) {
				updateTarget()
			}
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
			<div class="brand"></div>
		</GameObjectComponent>
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
