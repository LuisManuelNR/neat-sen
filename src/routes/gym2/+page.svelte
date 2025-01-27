<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { clamp } from '$lib/utils'
	import { CLabel } from '@chasi/ui'

	const MAX_SPEED = 4
	const w = 1000
	const h = 600

	let target = new GameObject()
	target.x = randomNumber(50, w - 50)
	target.y = randomNumber(50, h - 50)
	let initialPos = { x: randomNumber(50, w - 50), y: randomNumber(50, h - 50) }
	class Spider extends Genome {
		speed = MAX_SPEED
		prevDistance = 0
		score = 0
		go = new GameObject()
		distanceToTarget = 0

		constructor() {
			super(3, 1)
			this.go.x = initialPos.x
			this.go.y = initialPos.y
			this.speed = MAX_SPEED
		}

		async seek() {
			this.distanceToTarget = this.go.distanceTo(target)

			this.go.x = clamp(this.go.x, 0, w)
			this.go.y = clamp(this.go.y, 0, h)
			// this.go.angle = clamp(this.go.angle, -Math.PI, Math.PI)

			const inputs = [
				linearScale(target.y - this.go.y, -h, h, 0, 1),
				linearScale(target.x - this.go.x, -w, w, 0, 1),
				linearScale(this.go.angleTo(target), -Math.PI, Math.PI, 0, 1)
				// linearScale(this.go.x, 0, w, 0, 1),
				// linearScale(this.go.y, 0, h, 0, 1),
				// linearScale(target.x, 0, w, 0, 1),
				// linearScale(target.y, 0, h, 0, 1),
				// linearScale(this.go.angle, -Math.PI, Math.PI, 0, 1)
				// linearScale(this.speed, 0, MAX_SPEED, 0, 1),
				// linearScale(this.distanceToTarget, 0, w, 0, 1)
				// atan2Normalized(this.go.angle)
			]

			const outputs = await this.brain.forward(inputs)

			const [newAngle, newSpeed] = outputs

			// this.speed = linearScale(newSpeed, 0, 1, 0, MAX_SPEED)
			// this.go.angle = newAngle
			// this.go.angle = desnormalizeAtan2(newAngle)
			this.go.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// respuesta
			// this.go.angle = this.go.angleTo(this.target)
		}

		async train() {
			this.go.forward(this.speed)
			await this.seek()
			this.updateFitness()
		}

		async evaluate() {
			this.go.forward(this.speed)
			await this.seek()
		}

		updateFitness() {
			const objective = this.go.angleTo(target)
			const error = Math.abs(this.go.angle - objective)
			// Fitness principal basado en el error del ángulo
			const errorContribution = 1 / (1 + error)

			// Penalizaciones por nodos y conexiones (en forma de divisores)
			const nodePenaltyFactor = 1 + this.brain.dag.nodes.size * 0.05
			const connectionPenaltyFactor = 1 + this.brain.dag.connections.size * 0.05

			// Reducir el impacto del errorContribution por los factores de penalización
			const penalizedFitness = errorContribution / (nodePenaltyFactor * connectionPenaltyFactor)

			// Fitness base para evitar valores bajos
			const baseFitness = 0.1

			// Actualizar fitness
			this.fitness += baseFitness + penalizedFitness
		}
	}

	function create() {
		return new Spider()
	}
	let showAll = false
	let spiders: Spider[] = []
	let frames = 0
	async function onNewGen(population: Spider[]) {
		spiders = population
		frames++
		if (frames % 50 === 0) {
			initialPos = { x: randomNumber(50, w - 50), y: randomNumber(50, h - 50) }
			target.x = randomNumber(50, w - 50)
			target.y = randomNumber(50, h - 50)
		}
	}

	async function onUpdate(population: Spider[]) {
		if (showAll) {
			spiders = population
		} else {
			spiders = [population[0]]
		}
	}

	function handleClick(e: MouseEvent) {
		const t = e.target as HTMLElement
		if (!t.closest('.simulator')) return
		target.x = e.offsetX
		target.y = e.offsetY
	}
</script>

<svelte:window on:click={handleClick} />

<Simulator population={50} {create} defaulEvolutionInterval={200} {onUpdate} {onNewGen}>
	<CLabel label="show all">
		<input type="checkbox" on:change={() => (showAll = !showAll)} />
	</CLabel>
	{#each spiders as spider}
		<SpiderComponent
			go={spider.go}
			color="oklab({100 / (1 + spider.distanceToTarget)} -0.04 -0.12 / 1)"
		/>
	{/each}
	<GameObjectComponent go={target}>
		<div class="target brand"></div>
	</GameObjectComponent>
</Simulator>

<style>
	.target {
		display: grid;
		place-content: center;
		pointer-events: none;
	}
</style>
