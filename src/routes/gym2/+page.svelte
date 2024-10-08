<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import {
		clamp,
		createBoundPoints,
		denormalize,
		isInsidePoly,
		normalize,
		randomGaussian,
		range,
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
	import LineChart from '$lib/Viz/LineChart.svelte'

	let w = 1000
	let h = 600

	let simulate = true
	let seeAll = false
	let step = 1
	let frames = 0
	let generations = 0
	let EVOLUTION_INTERVAL = 200
	let globalFitness: number[] = []

	const POPULATION_SIZE = 60
	const MAX_SPEED = 6
	class Spider extends GameObject {
		brain: Brain
		fitness = 0
		speed = MAX_SPEED
		prevDistance = 0
		inputs: number[]
		outputs: number[]
		score = 0
		target = new GameObject()
		lookingPercentage = 0
		distanceToTarget = 0

		constructor(b: Brain) {
			super()
			this.brain = b
			this.x = randomNumber(50, w - 50)
			this.y = randomNumber(50, h - 50)
			this.target.x = randomNumber(50, w - 50)
			this.target.y = randomNumber(50, h - 50)
			this.inputs = []
			this.outputs = []
			this.speed = MAX_SPEED
		}

		seek() {
			// if (this.x <= 0 || this.x >= w) this.speed = 0
			// if (this.y <= 0 || this.y >= h) this.speed = 0
			// this.x = clamp(this.x, 0, w)
			// this.y = clamp(this.y, 0, h)
			// this.angle = clamp(this.angle, 0, Math.PI * 2)
			// this.speed = clamp(this.speed, 0, MAX_SPEED)
			// this.lookingPercentage = this.lookingAt(this.target)
			this.distanceToTarget = this.distanceTo(this.target)

			this.inputs = [
				this.x / w,
				this.target.x / w,
				this.y / h,
				this.target.y / h
				// linearScale(this.angle, -Math.PI, Math.PI, 0, 1),
				// linearScale(this.speed, 0, MAX_SPEED, 0, 1)
				// linearScale(this.distanceToTarget, 0, w, 0, 1)
				// linearScale(this.angleTo(this.target), -Math.PI, Math.PI, 0, 1)
			]

			this.outputs = this.brain.forward(this.inputs)

			const [newAngle, newSpeed] = this.outputs

			this.speed = linearScale(newSpeed, 0, 1, 0, MAX_SPEED)
			this.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// respuesta
			// this.angle = this.angleTo(this.target)

			this.forward(this.speed)

			if (this.distanceToTarget < 25) {
				this.updateTarget()
			}
		}

		train() {
			this.seek()
			this.updateFitness()
		}

		updateFitness() {
			const objective = this.angleTo(this.target)
			const error = Math.abs(this.angle - objective)
			this.fitness -= error

			// if (this.distanceToTarget < this.prevDistance) {
			// 	this.fitness += 1 / (1 + this.distanceToTarget)
			// } else if (this.distanceToTarget > this.prevDistance) {
			// 	this.fitness -= 1 / (1 + this.distanceToTarget)
			// }

			// this.prevDistance = this.distanceToTarget
		}

		updateTarget() {
			this.score++
			if (this.score > 20) {
				this.score = 0
				this.target.x = randomNumber(50, w - 50)
				this.target.y = randomNumber(50, h - 50)
			}
		}
	}

	const simulation = new Simulation({
		inputs: 4,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let genFitness = 0
	function update() {
		frames++
		if (simulate) {
			simulation.population.forEach((s, i) => {
				s.train()
				simulation.population[i] = simulation.population[i]
				genFitness += s.fitness
			})
			genFitness /= POPULATION_SIZE
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				globalFitness = [...globalFitness, genFitness]
				if (globalFitness.length > 200) {
					globalFitness.shift()
					globalFitness = globalFitness
				}
			}
		} else {
			simulation.population[0].seek()
			simulation.population[0] = simulation.population[0]
		}
	}

	function stopSimulation() {
		simulate = false
	}

	onMount(() => {
		return runOnFrames(120, () => {
			for (let i = 0; i < step; i++) {
				update()
			}
		})
	})
</script>

<div>
	{#if simulate}
		<button class="btn error" on:click={stopSimulation}> pause </button>
	{:else}
		<button class="btn success" on:click={() => (simulate = true)}> evolve </button>
	{/if}
	<CLabel label="simulation by frame {step}">
		<input type="range" min="0" max="20" bind:value={step} />
	</CLabel>
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
				<SpiderComponent
					go={spider}
					color="oklab({100 / (1 + spider.distanceToTarget)} -0.04 -0.12 / 1)"
				/>
			{/each}
		{:else}
			{@const spider = simulation.population[0]}
			<SpiderComponent
				go={spider}
				color="oklab({100 / (1 + spider.distanceToTarget)} -0.04 -0.12 / 1)"
			/>
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

<LineChart
	x={range([0, globalFitness.length], globalFitness.length)}
	y={globalFitness}
	width={1000}
	height={300}
></LineChart>

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
