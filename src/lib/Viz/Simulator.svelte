<script lang="ts">
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
	export let onNewGen: (population: T[]) => void = () => {}
	export let onUpdate: (population: T[]) => void = () => {}

	let evolutionInterval = defaulEvolutionInterval
	let simulate = false
	let step = 1
	let frames = 0
	let generations = 0
	let globalFitness: number[] = []

	const simulation = new Simulation(population, create)

	let genFitness = 0
	function update() {
		if (simulate) {
			frames++
			simulation.population.forEach((s, i) => {
				s.train()
				simulation.population[i] = simulation.population[i]
				genFitness += s.fitness
			})
			genFitness /= population
			if (frames % evolutionInterval === 0) {
				simulation.evolve()
				generations = simulation.getGeneration()
				globalFitness = [...globalFitness, genFitness]
				if (globalFitness.length > 200) {
					globalFitness.shift()
					globalFitness = globalFitness
				}
				onNewGen(simulation.population)
			}
			onUpdate(simulation.population)
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
		return runOnFrames(60, () => {
			for (let i = 0; i < step; i++) {
				update()
			}
		})
	})
</script>

<div class="d-flex align-center gap-4 mb-4">
	{#if simulate}
		<button class="btn error" on:click={stopSimulation}> pause </button>
	{:else}
		<button class="btn success" on:click={startSimulation}> evolve </button>
	{/if}
	<CLabel label="evolve intereval" class="s-6">
		<input type="number" bind:value={evolutionInterval} />
	</CLabel>

	<CLabel label="simulation rate x {step}" class="s-6">
		<input type="range" min="0" max="20" bind:value={step} />
	</CLabel>
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
