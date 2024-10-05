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

	export let w = 600
	export let h = 600

	let simulate = true
	let seeAll = false

	const POPULATION_SIZE = 50
	let target = new Vec2D(w / 2, h / 2)
	let targetBound = createBoundPoints(4, target, 25)
	class Spider {
		pos: Vec2D
		brain: Brain
		spiderBound: Vec2D[]
		maxSpeed = 6
		speed: number
		fitness = 0

		constructor(b: Brain, pos?: Vec2D, speed = 0) {
			this.brain = b
			this.pos = pos || new Vec2D(randomNumber(0, w), randomNumber(0, h))
			this.spiderBound = createBoundPoints(8, this.pos, 30)
			this.speed = speed
		}

		seek() {
			const inputs = [
				this.pos.x,
				this.pos.y,
				this.pos.direccion,
				target.x,
				target.y,
				target.direccion
				// this.pos.angleTo(target),
				// this.pos.distanceTo(target)
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

		updateFitness() {
			let fit = 0
			const distance = this.pos.distanceTo(target)
			// Recompensa inversamente proporcional a la distancia
			fit += 1 / (1 + distance)

			if (distance < 100) {
				const dirDiff = this.pos.direccion - target.direccion
				fit += 0.5 / (1 + dirDiff)
			}

			this.fitness += fit
		}
	}

	function updateTarget() {
		const marging = 25
		target.forward(2)
		target.direccion = linearScale(Math.sin(frames * 0.005), 0, 1, 0, 360)
		target.clamp(marging, w - marging, marging, h - marging)
		targetBound = createBoundPoints(4, target, marging)
		target = target
	}

	const simulation = new Simulation({
		inputs: 6,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let EVOLUTION_INTERVAL = 200
	function update() {
		frames++
		if (simulate || generations >= 2000) {
			// if (frames % 200 === 0) EVOLUTION_INTERVAL += 5
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = simulation.population[i]
			})
		}
		updateTarget()
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
	<div class="enviroment s-6" bind:clientWidth={w} bind:clientHeight={h}>
		<Target bind:pos={target}></Target>

		<!-- <Bounding vertices={best.spiderBound}></Bounding>
		<Bounding vertices={targetBound}></Bounding> -->
		{#each simulation.population as spider, i}
			<Creature color="oklab({spider.fitness * 0.05} -0.04 -0.12 / 1)" pos={spider.pos}></Creature>
		{/each}
	</div>

	<Network network={simulation.population[0].brain}></Network>
</div>

<style>
	.wrapper {
		--md-columns: 1fr auto;
	}
	.enviroment {
		position: relative;
		width: 100%;
		height: 600px;
	}
</style>
