<script lang="ts">
	import { runOnFrames, randomNumber } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'
	import Target from './Target.svelte'
	import { createBoundPoints, isInsidePoly, normalize, Vec2D } from './utils'
	import Bouning from './Bouning.svelte'
	import { Genome, NEAT } from './NEAT/NEATNN'

	export let w = 800
	export let h = 600

	let simulate = false
	let x = 200
	let y = 200
	let dir = 0
	const speed = 5
	const turnRate = 10
	const keysPressed: Record<string, boolean> = {}

	let xT = randomNumber(0, 700)
	let yT = randomNumber(0, 500)
	let spiderBound: Vec2D[] = []
	let targetBound: Vec2D[] = []

	class Spider extends Genome {
		x = 200
		y = 200
		dir = randomNumber(0, 360)

		seek(target: number[]) {
			const normalized = [x, y, dir, ...target].map((v) => normalize(v, 0, 700))
			const out = this.network.forward(normalized)
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
			return [this.x, this.y]
		}
	}

	function fitnessFunction(agent: Spider) {
		const targetOutput = [xT, yT]
		const outputs = agent.seek(targetOutput)
		// Calcular la distancia entre los outputs generados y los valores objetivo
		let distance = 0
		for (let i = 0; i < outputs.length; i++) {
			const error = targetOutput[i] - outputs[i]
			distance += error * error // Usamos el error cuadrático para penalizar grandes diferencias
		}

		// Retornar el fitness, que es inversamente proporcional a la distancia
		// Cuanto más pequeña la distancia, mayor el fitness
		const fit = 1 / (1 + distance)
		return fit * fit
	}

	const simulation = new NEAT(5, 2, 100, fitnessFunction, (brain) => new Spider(brain))

	let generations = 0
	let bestAgent: Spider | undefined
	function update() {
		if (simulate) {
			simulation.evolve()
			bestAgent = simulation.getBestGenome()
			generations = simulation.getGeneration()
			if (generations % 150 === 0) {
				console.log(bestAgent)
			}
		} else if (bestAgent) {
			bestAgent.seek([xT, yT])
		}
		if (bestAgent) {
			x = bestAgent.x
			y = bestAgent.y
			dir = bestAgent.dir
		}
		// const rad = (Math.PI / 180) * (dir - 90)
		// if (keysPressed['w']) {
		// 	x += Math.cos(rad) * speed
		// 	y += Math.sin(rad) * speed
		// 	if (x < 0) x = 0
		// 	if (y < 0) y = 0
		// 	if (x > w) x = w
		// 	if (y > h) y = h
		// }
		// if (keysPressed['a']) {
		// 	dir -= turnRate
		// }
		// if (keysPressed['d']) {
		// 	dir += turnRate
		// }
		spiderBound = createBoundPoints(8, new Vec2D(x, y), 15)
		targetBound = createBoundPoints(4, new Vec2D(xT, yT), 25)
		if (isInsidePoly(spiderBound, targetBound)) {
			xT = randomNumber(0, 700)
			yT = randomNumber(0, 500)
		}
	}

	// Manejar cuando se presiona una tecla
	// const handleKeyDown = (e: KeyboardEvent) => {
	// 	keysPressed[e.key] = true
	// }

	// const handleKeyUp = (e: KeyboardEvent) => {
	// 	keysPressed[e.key] = false
	// }

	onMount(() => {
		return runOnFrames(24, update)
	})
</script>

<!-- <svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} /> -->

{#if simulate}
	<button class="btn" on:click={() => (simulate = false)}> stop </button>
{:else}
	<button class="btn" on:click={() => (simulate = true)}> start </button>
{/if}

<div class="enviroment s-6" bind:clientWidth={w} style:height="{h}px">
	<Target x={xT} y={yT}></Target>
	<Creature {x} {y} direction={dir}></Creature>
	<!-- <Bouning vertices={spiderBound}></Bouning>
	<Bouning vertices={targetBound}></Bouning> -->
</div>

<p>generations: {generations}</p>
{#if bestAgent}
	<p>fitness: {bestAgent.fitness}</p>
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
