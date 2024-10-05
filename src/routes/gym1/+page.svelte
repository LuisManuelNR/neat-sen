<script lang="ts">
	import { Simulation } from '$lib/NEAT/Simulator'
	import { normalize, range } from '$lib/utils'
	import { runOnFrames } from '@chasi/ui/utils'
	import { linearScale } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { max, min } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Network from '$lib/Viz/Network.svelte'
	import { Brain } from '$lib/KAN/Brain'
	import Spline from '$lib/Viz/Spline.svelte'
	import { BSpline } from '$lib/KAN/BSpline'

	let simulate = false
	let seeAll = false

	const x = range([0, 1], 100)
	const targetSpline = new BSpline(20)
	const target = {
		evaluate: () => x.map(targetSpline.evaluate)
	}

	const POPULATION_SIZE = 50
	const INPUT_SIZE = 1
	const OUTPUT_SIZE = 1

	class Agent {
		fitness = 0
		brain: Brain
		inputs: number[]
		outputs: number[]

		constructor(b: Brain) {
			this.brain = b
			this.outputs = [0]
			this.inputs = [Math.random()]
		}

		train() {
			const value = Math.random()
			this.inputs = [value]
			this.outputs = this.brain.forward(this.inputs)

			const real = targetSpline.evaluate(value)
			const realNorm = normalize(real, 0, 8)
			const error = Math.pow(this.outputs[0] - realNorm, 2)

			this.fitness += 1 / (1 + error)
		}

		evaluate() {
			return x.map((n) => this.brain.forward([n])[0])
		}
	}

	const simulation = new Simulation({
		inputs: INPUT_SIZE,
		outputs: OUTPUT_SIZE,
		populationSize: POPULATION_SIZE,
		createIndividual: (b) => new Agent(b)
	})

	let frames = 0
	let generations = 0
	$: best = simulation.population[0]
	function update() {
		frames++
		if (simulate || generations >= 2000) {
			if (frames % 100 === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
			}
			simulation.population.forEach((s, i) => {
				s.train()
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
	<p>best fitness: {best.fitness}</p>
</div>

<div class="wrapper d-grid gap-2">
	<Spline {x} y={best.evaluate()} width={400} height={400} helpers></Spline>
	<Network inputs={best.inputs} network={best.brain} outputs={best.outputs}></Network>
	<Spline {x} y={target.evaluate()} width={400} height={400} helpers></Spline>
</div>

<style>
	.wrapper {
		--md-columns: auto 1fr;
	}
</style>
