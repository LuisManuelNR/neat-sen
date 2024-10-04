<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import {
		clamp,
		createBoundPoints,
		denormalize,
		isInsidePoly,
		normalize,
		Vec2D,
		VecN
	} from '$lib/utils'
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

	const POPULATION_SIZE = 10
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
			const inputs = [this.pos.x, this.pos.y, target.x, target.y, this.pos.angleTo(target)]
			const minI = min(inputs)
			const maxI = max(inputs)
			const normalized = inputs.map((n) => normalize(n, minI, maxI))

			const out = this.brain.forward(normalized)

			const direction = linearScale(out[0], 0, 1, 0, 360)
			this.speed = linearScale(out[1], 0, 1, 0, this.maxSpeed)

			this.pos.direccion = direction
			this.pos.forward(this.speed)

			// if (this.pos.x < 0) this.pos.x = w
			// if (this.pos.y < 0) this.pos.y = h

			// if (this.pos.x > w) this.pos.x = 0
			// if (this.pos.y > h) this.pos.y = 0

			this.spiderBound = createBoundPoints(8, this.pos, 30)

			this.updateFitness()
		}

		updateFitness() {
			const distance = this.pos.distanceTo(target)
			const pd = Math.pow(distance, 2)

			// Recompensa inversamente proporcional a la distancia
			this.fitness += 1 / (1 + pd)

			// Recompensa por estar cerca del objetivo
			if (distance < 50) {
				this.fitness += 5
			}

			// Recompensa por estar dentro del límite del objetivo
			// if (isInsidePoly(this.spiderBound, targetBound)) {
			// 	this.fitness += 10
			// }

			// Recompensa por velocidad consistente y eficiente hacia el objetivo
			const directionToTarget = this.pos.angleTo(target)
			const angularDifference = Math.abs(this.pos.direccion - directionToTarget)
			const speedFactor = 1 - angularDifference / 180

			// Ajuste basado en la eficiencia de dirección y velocidad
			this.fitness += speedFactor * this.speed

			// Penalización si la araña se está alejando del objetivo
			if (angularDifference > 90) {
				this.fitness -= 0.5 // Penalización por alejarse del objetivo
			}
		}

		clone() {
			this.fitness = 0
			return this
		}
	}

	function updateTarget() {
		target.forward(1)
		target.x = clamp(target.x, 0, w)
		target.y = clamp(target.y, 0, h)
		if (target.x <= 0 || target.x >= w) target.direccion = randomNumber(0, 360)
		if (target.y <= 0 || target.y >= h) target.direccion = randomNumber(0, 360)
		targetBound = createBoundPoints(4, target, 25)
	}

	const simulation = new Simulation({
		inputs: 5,
		outputs: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Spider(b)
	})

	let frames = 0
	let generations = 0
	let best = simulation.getBestIndividual()
	let EVOLUTION_INTERVAL = 200
	function update() {
		frames++
		if (simulate || generations >= 2000) {
			if (frames % EVOLUTION_INTERVAL === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				best = simulation.getBestIndividual()
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = simulation.population[i]
			})
		}
		updateTarget()
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
	<div class="enviroment s-6" bind:clientWidth={w} bind:clientHeight={h}>
		<Target bind:pos={target}></Target>
		<Creature color="#9100ff" pos={best.pos}></Creature>
		<Bounding vertices={best.spiderBound}></Bounding>
		<Bounding vertices={targetBound}></Bounding>
		{#if seeAll}
			{#each simulation.population as spider}
				<Creature pos={spider.pos}></Creature>
			{/each}
		{/if}
	</div>

	<Network network={best.brain}></Network>
</div>

<style>
	.wrapper {
		--md-columns: 1fr auto;
	}
	.enviroment {
		position: relative;
		width: 100%;
	}
</style>
