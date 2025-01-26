<script lang="ts">
	import { runEveryFrames } from '$lib/utils'

	import { Simulation, type CreateFunction, type Genome } from '$lib/NEAT/Simulator'
	import { max, min, runOnFrames } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Network from '$lib/Viz/Network.svelte'
	import LineChart from '$lib/Viz/LineChart.svelte'

	type T = $$Generic<Genome>
	export let population: number
	export let create: CreateFunction<T>
	export let defaulEvolutionInterval = 200
	export let onNewGen: (population: T[]) => void | Promise<void> = () => {}
	export let onUpdate: (population: T[]) => void | Promise<void> = () => {}

	let evolutionInterval = defaulEvolutionInterval
	let simulate = false
	let rate = 1
	let frames = 0
	let generations = 0
	let globalFitness: number[] = []

	const simulation = new Simulation(population, create)

	async function update() {
		if (simulate) {
			frames++
			await Promise.all(simulation.population.map((s) => s.train()))
			if (frames % evolutionInterval === 0) {
				let genFitness = simulation.population.reduce((p, c) => c.fitness + p, 0)
				genFitness /= population
				generations++
				globalFitness.push(genFitness)
				if (globalFitness.length > 200) {
					globalFitness.shift()
				}
				globalFitness = globalFitness
				simulation.population = simulation.population
				await onNewGen(simulation.population)
				simulation.evolve()
			}
			await onUpdate(simulation.population)
		} else {
			frames = 0
		}
	}

	function stopSimulation() {
		simulate = false
	}
	function startSimulation() {
		frames = 0
		simulate = true
	}

	onMount(() => {
		return runEveryFrames(() => rate, update)
	})
</script>

<div class="d-flex align-center gap-4 mb-4">
	{#if simulate}
		<button class="btn error" on:click={stopSimulation}> pause </button>
	{:else}
		<button class="btn success" on:click={startSimulation}> train </button>
	{/if}
	<CLabel label="evolve intereval" class="s-6">
		<input type="number" bind:value={evolutionInterval} />
	</CLabel>

	<CLabel label="simulation rate x {rate}" class="s-6">
		<input type="range" min="0" max="20" bind:value={rate} />
	</CLabel>

	<!-- <button class="btn success" on:click={startSimulation}> predict </button> -->
</div>

<div class="simulator s-6 pa-4 mb-4">
	<slot best={simulation.population[0]} all={simulation.population} />
</div>

<div class="metrics d-grid gap-4">
	<LineChart
		domainX={[generations - globalFitness.length, generations]}
		domainY={[min(globalFitness), max(globalFitness)]}
		charts={[globalFitness]}
		height={400}
	></LineChart>
	<Network network={simulation.population[0].brain}></Network>
</div>

<style>
	.simulator {
		position: relative;
		min-height: 600px;
	}
	.metrics {
		--sm-columns: 1fr 1fr;
	}
</style>
