<script lang="ts">
	import { pannable } from '@chasi/ui/actions'
	import { runOnFrames, randomNumber } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'
	import Target from './Target.svelte'
	import { createBoundPoints, isInsidePoly, normalize, Vec2D } from './utils'
	import { plugins, TinyNEAT } from 'tinyneat'

	export let w = 800
	export let h = 600

	let simulate = true
	const speed = 5
	const turnRate = 10

	let xT = 1000
	let yT = 400

	type SpiderBrain = ReturnType<typeof simulation.getPopulation>[number]

	class Spider {
		x = randomNumber(0, 300)
		y = randomNumber(0, h)
		dir = 90
		recorrido: number = 0
		brain: SpiderBrain

		constructor(b: SpiderBrain) {
			this.brain = b
		}

		seek(target: number[]) {
			const inputs = [this.recorrido, this.x, this.y, this.dir, ...target]
			// const normalized = inputs.map((v) => normalize(v, -w, w))
			const out = this.brain.process(inputs)
			// console.log('in:', inputs)
			// console.log('out:', out)
			if (out[1] > 0) {
				this.dir -= turnRate
				this.recorrido++
			}
			if (out[1] < 0) {
				this.dir += turnRate
				this.recorrido++
			}
			const rad = (Math.PI / 180) * (this.dir - 90)
			if (out[0] > 0) {
				this.x += Math.cos(rad) * speed
				this.y += Math.sin(rad) * speed
				this.recorrido++
			}
			this.brain.fitness += fitnessFunction(this.x, this.y, this.recorrido)
		}
	}

	function fitnessFunction(x: number, y: number, recorrido: number) {
		let distance = 0
		distance += Math.pow(xT - x, 2)
		distance += Math.pow(yT - y, 2)
		distance += recorrido
		return 1 / (1 + distance)
	}

	const POPULATION_SIZE = 20

	const simulation = TinyNEAT({
		maxGenerations: 150,
		targetSpecies: 2,
		initialPopulationSize: POPULATION_SIZE,
		inputSize: 6,
		outputSize: 2,
		compatibilityThreshold: 4.5,
		addLinkProbability: 0.1,
		addNodeProbability: 0.2,
		mutateWeightProbability: 0.4,
		interspeciesMatingRate: 0.01,
		largeNetworkSize: 50,
		maximumStagnation: 5,
		mateByChoosingProbability: 0.6,
		nnPlugin: plugins.ANNPlugin({ activation: 'posAndNegSigmoid' })
		// loggingPlugins: []
	})

	let spiders: Spider[] = Array.from(simulation.getPopulation(), (brain) => new Spider(brain))
	let frames = 0
	let generations = 0
	function update() {
		frames++
		if (simulate) {
			if (frames % 400 === 0) {
				// xT = randomNumber(900, w)
				// yT = randomNumber(0, h)
				simulation.evolve()
				const population = simulation.getPopulation()
				generations = simulation.getCurrentGeneration()
				spiders = Array.from(population, (brain) => new Spider(brain))
				if (simulation.complete()) {
					stopSimulation()
				}
			}
			spiders.forEach((s, i) => {
				s.seek([xT, yT])
				spiders[i] = s
			})
		} else {
			spiders[0].seek([xT, yT])
			spiders[0] = spiders[0]
		}
	}

	function stopSimulation() {
		simulate = false
		spiders = getBestSpiders(spiders, 1)
	}

	function getBestSpiders(s: Spider[], amounts: number) {
		return s.toSorted((a, b) => b.brain.fitness - a.brain.fitness).slice(0, amounts)
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
	<p>generations: {generations} fitness: {spiders[0].brain.fitness}</p>
</div>

<div class="enviroment s-6" bind:clientWidth={w} style:height="{h}px">
	<Target bind:x={xT} bind:y={yT}></Target>
	{#if !simulate}
		{@const spider = spiders[0]}
		<Creature x={spider.x} y={spider.y} direction={spider.dir}></Creature>
	{:else}
		{#each spiders as spider}
			<Creature x={spider.x} y={spider.y} direction={spider.dir}></Creature>
		{/each}
	{/if}
</div>

<style>
	.enviroment {
		position: relative;
		width: 100%;
	}
</style>
