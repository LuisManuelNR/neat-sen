<script lang="ts">
	import { runEveryFrames } from '$lib/utils'

	import { Simulation, type CreateFunction, type Agent } from '$lib/NEAT/Simulator'
	import type { Brain } from '$lib/Network'
	import { max, min } from '@chasi/ui/utils'
	import { CLabel } from '@chasi/ui'
	import { onMount } from 'svelte'
	import Network from '$lib/Viz/Network.svelte'
	import LineChart from '$lib/Viz/LineChart.svelte'

	export let population: number
	export let create: CreateFunction<Agent>
	export let defaulEvolutionInterval = 200
	export let onNewGen: (population: Agent[], best: Agent) => void | Promise<void> = () => {}
	export let onUpdate: (population: Agent[], best: Agent) => void | Promise<void> = () => {}

	let evolutionInterval = defaulEvolutionInterval
	let simulate = false
	let rate = 1
	let frames = 0
	let generations = 0
	let globalFitness: number[] = []

	const simulation = new Simulation(population, create)
	let best = create()
	function update() {
		if (simulate) {
			frames++
			simulation.population.map((s) => s.train())
			onUpdate(simulation.population, best)
			if (frames % evolutionInterval === 0) {
				let genFitness = simulation.population.reduce((p, c) => c.fitness + p, 0)
				genFitness /= population
				generations++
				globalFitness.push(genFitness)
				if (globalFitness.length > 200) {
					globalFitness.shift()
				}
				globalFitness = globalFitness
				if (simulation.population[0].fitness) {
					best = simulation.population[0].clone()
					best.fitness = simulation.population[0].fitness
					best = best
				}
				onNewGen(simulation.population, best)
				simulation.evolve()
			}
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
	<Network network={best.brain}></Network>
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
