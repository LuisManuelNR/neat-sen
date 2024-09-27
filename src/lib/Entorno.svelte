<script lang="ts">
	import { runOnFrames } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'
	import Target from './Target.svelte'
	import { Vec2D } from './utils'
	import { Individuals, NEAT } from './KAN/NEAT'
	import VizKan from './KAN/VizKan.svelte'

	export let w = 800
	export let h = 600

	let simulate = false
	const SPEED = 5
	const TURN_RATE = 10
	const POPULATION_SIZE = 2

	let target = new Vec2D(1000, 300)

	class Spider extends Individuals {
		pos: Vec2D = new Vec2D(200, 200)
		dir = 90

		seek() {
			// const inputs = [this.pos.x, this.pos.y, target.x, target.y]
			const normalized = [this.pos.x / w, this.pos.y / h, target.x / w, target.y / h]
			const out = this.brain.forward(normalized)
			console.log(out)
			if (out[0] > 0.2) {
				this.dir -= TURN_RATE
			}
			if (out[0] < -0.2) {
				this.dir += TURN_RATE
			}
			const rad = (Math.PI / 180) * (this.dir - 90)
			if (out[1] >= 0) {
				this.pos.x += Math.cos(rad) * SPEED
				this.pos.y += Math.sin(rad) * SPEED
			}
			this.fitness += fitnessFunction(this.pos)
		}
	}

	function fitnessFunction(pos: Vec2D) {
		let fit = 0
		fit += Math.pow(target.x - pos.x, 2)
		fit += Math.pow(target.y - pos.y, 2)
		return 1 / (1 + fit)
	}

	const simulation = new NEAT({
		inputDim: 4,
		outputDim: 2,
		populationSize: POPULATION_SIZE,
		createIndividual: (brain) => new Spider(brain)
	})

	let frames = 0
	let generations = 0
	// console.log(simulation.population)
	function update() {
		frames++
		if (simulate) {
			if (frames % 150 === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				console.log(simulation.population[0])
			}
			simulation.population.forEach((s, i) => {
				s.seek()
				simulation.population[i] = s
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
		return runOnFrames(2, update)
	})
</script>

<div>
	{#if simulate}
		<button class="btn error" on:click={stopSimulation}> pause </button>
	{:else}
		<button class="btn success" on:click={() => (simulate = true)}> evolve </button>
	{/if}
	<p>generations: {generations}</p>
	<p>best fitness: {simulation.population[0].fitness}</p>
</div>

<div class="enviroment s-6" bind:clientWidth={w} style:height="{h}px">
	<Target bind:x={target.x} bind:y={target.y}></Target>
	{#if !simulate}
		{@const spider = simulation.population[0]}
		<Creature color="#9100ff" x={spider.pos.x} y={spider.pos.y} direction={spider.dir}></Creature>
	{:else}
		{#each simulation.population as spider, i}
			{#if i === 0}
				<Creature color="#9100ff" x={spider.pos.x} y={spider.pos.y} direction={spider.dir}></Creature>
			{:else}
				<Creature x={spider.pos.x} y={spider.pos.y} direction={spider.dir}></Creature>
			{/if}
		{/each}
	{/if}
</div>

<!-- {#if simulation.population[0]}
	<VizKan brain={simulation.population[0].brain}></VizKan>
{/if} -->

<style>
	.enviroment {
		position: relative;
		width: 100%;
	}
</style>
