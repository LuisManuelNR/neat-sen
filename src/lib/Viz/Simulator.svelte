<script lang="ts">
	import { runEveryFrames } from '$lib/utils'
	import { Simulation, type CreateFunction } from '$lib/NEAT/Simulator'
	import { max, min } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Network from '$lib/Viz/Network.svelte'
	import LineChart from '$lib/Viz/LineChart.svelte'

	type T = $$Generic

	export let population: number
	export let create: CreateFunction<T>
	export let defaulEvolutionInterval = 200
	export let onNewGen: (population: T[], best: T) => void = () => {}
	export let onUpdate: (population: T[], best: T) => void = () => {}

	let evolutionInterval = defaulEvolutionInterval
	let simulate = false
	let rate = 1
	let frames = 0

	let fitness: number[] = []

	let simulation = new Simulation<any>(population, create)
	function update() {
		if (simulate) {
			frames++
			simulation.population.forEach((a) => a.train())
			onUpdate(simulation.population, simulation.best)
			if (frames % evolutionInterval === 0) {
				onNewGen(simulation.population, simulation.best)
				simulation.evolve()
				fitness.push(Number(simulation.fitness.toFixed(2)))
				if (fitness.length > 200) {
					fitness.shift()
				}
				fitness = fitness
			}
			simulation = simulation
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
	<CLabel label="evolve interval" class="s-6">
		<input type="number" bind:value={evolutionInterval} />
	</CLabel>

	<CLabel label="simulation rate x {rate}" class="s-6">
		<input type="range" min="0" max="20" bind:value={rate} />
	</CLabel>
</div>

<div class="simulator s-6 pa-4 mb-4">
	<slot best={simulation.best} all={simulation.population} />
</div>

<div class="metrics d-grid gap-4">
	<LineChart
		domainX={[simulation.generation - fitness.length, simulation.generation]}
		domainY={[min(fitness), max(fitness)]}
		charts={[fitness]}
		height={400}
	></LineChart>
	<!-- <Network network={simulation.best?.brain}></Network> -->
</div>

<style>
	.simulator {
		position: relative;
	}
	.metrics {
		--sm-columns: 1fr 1fr;
	}
</style>
