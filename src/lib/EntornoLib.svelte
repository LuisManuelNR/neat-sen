<script lang="ts">
	import { runOnFrames, randomNumber } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'
	import Target from './Target.svelte'
	import { createBoundPoints, isInsidePoly, normalize, Vec2D } from './utils'
	import { plugins, TinyNEAT } from 'tinyneat'

	export let w = 800
	export let h = 600

	let simulate = false
	const speed = 5
	const turnRate = 10

	let xT = randomNumber(0, 700)
	let yT = randomNumber(0, 500)

	type SpiderBrain = ReturnType<typeof simulation.getPopulation>[number]

	class Spider {
		x = 200
		y = 200
		dir = randomNumber(0, 360)
		brain: SpiderBrain

		constructor(b: SpiderBrain) {
			this.brain = b
		}

		seek(target: number[]) {
			// const normalized = [x, y, dir, ...target].map((v) => normalize(v, 0, 700))
			const out = this.brain.process([this.x, this.y, this.dir, ...target])
			const rad = (Math.PI / 180) * (this.dir - 90)
			if (out[0] > 0.5) {
				this.x += Math.cos(rad) * speed
				this.y += Math.sin(rad) * speed
			}
			if (out[1] > 0.5) {
				this.dir -= turnRate
			}
			if (out[1] < 0.5) {
				this.dir += turnRate
			}
			this.brain.fitness += fitnessFunction([this.x, this.y])
		}
	}

	function fitnessFunction(out: number[]) {
		const targetOutput = [xT, yT]
		let distance = 0
		for (let i = 0; i < out.length; i++) {
			const error = targetOutput[i] - out[i]
			distance += error * error // Usamos el error cuadrático para penalizar grandes diferencias
		}

		// Retornar el fitness, que es inversamente proporcional a la distancia
		// Cuanto más pequeña la distancia, mayor el fitness
		const fit = 1 / (1 + distance)
		return fit * fit
	}

	const POPULATION_SIZE = 50

	const simulation = TinyNEAT({
		maxGenerations: 50,
		targetSpecies: 10,
		initialPopulationSize: POPULATION_SIZE,
		inputSize: 5,
		outputSize: 2,
		compatibilityThreshold: 4.5,
		addLinkProbability: 0.1,
		addNodeProbability: 0.2,
		mutateWeightProbability: 0.4,
		interspeciesMatingRate: 0.01,
		largeNetworkSize: 50,
		maximumStagnation: 10,
		mateByChoosingProbability: 0.6,
		nnPlugin: plugins.ANNPlugin({ activation: 'posAndNegSigmoid' }),
		loggingPlugins: []
	})

	let generations = 0
	let bestAgent: Spider | undefined
	let spiders: Spider[] = []

	function update() {
		if (simulate) {
			simulation.evolve()
			const population = simulation.getPopulation()
			spiders = Array.from(population, (brain) => new Spider(brain))
			for (let i = 0; i < population.length; i++) {
				spiders[i].seek([xT, yT])
			}
			bestAgent = spiders[0]
			generations = simulation.getCurrentGeneration()
			if (generations % 150 === 0) {
				console.log(bestAgent)
			}
		} else if (bestAgent) {
			bestAgent.seek([xT, yT])
		}
		if (generations % 50 === 0) {
			const { x, y } = movimientoAleatorio(xT, yT, w, h, 100)
			xT = x
			yT = y
		}
	}

	function movimientoAleatorio(
		xActual: number,
		yActual: number,
		limiteX: number,
		limiteY: number,
		variacionMaxima: number
	): { x: number; y: number } {
		// Variaciones aleatorias pero controladas
		const nuevaX = xActual + (Math.random() * 2 - 1) * variacionMaxima
		const nuevaY = yActual + (Math.random() * 2 - 1) * variacionMaxima

		// Asegurar que las nuevas coordenadas estén dentro de los límites
		const xFinal = Math.max(0, Math.min(limiteX, nuevaX))
		const yFinal = Math.max(0, Math.min(limiteY, nuevaY))

		return { x: xFinal, y: yFinal }
	}

	onMount(() => {
		return runOnFrames(30, update)
	})
</script>

{#if simulate}
	<button class="btn" on:click={() => (simulate = false)}> stop </button>
{:else}
	<button class="btn" on:click={() => (simulate = true)}> start </button>
{/if}

<div class="enviroment s-6" bind:clientWidth={w} style:height="{h}px">
	<Target x={xT} y={yT}></Target>
	{#each spiders as spider}
		<Creature x={spider.x} y={spider.y} direction={spider.dir}></Creature>
	{/each}
</div>

<p>generations: {generations}</p>
{#if bestAgent}
	<p>fitness: {bestAgent.brain.fitness}</p>
{/if}

<style>
	.enviroment {
		position: relative;
		width: 100%;
	}
	:global(.debug > *) {
		outline: 1px solid var(--brand);
	}
</style>
