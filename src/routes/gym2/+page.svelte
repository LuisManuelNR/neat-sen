<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { clamp, randomGaussian, sigmoid } from '$lib/utils'
	import { CLabel } from '@chasi/ui'

	const MAX_SPEED = 4
	const w = 1000
	const h = 600

	let target = new GameObject(w, h)
	target.x = w / 2
	target.y = h / 2
	class Spider extends Genome {
		speed = MAX_SPEED
		prevDistance = 0
		score = 0
		go = new GameObject(w, h)
		distanceToTarget = 0

		constructor() {
			super(2, 1)
			this.go.x = target.x
			this.go.y = target.y
			this.speed = MAX_SPEED
			this.go.angle = randomNumber(-Math.PI, Math.PI)
		}

		async seek() {
			const inputs = [
				linearScale(target.y - this.go.y, -h, h, 0, 1),
				linearScale(target.x - this.go.x, -w, w, 0, 1)
				// linearScale(target.x, 0, w, 0, 1),
				// linearScale(this.go.x, 0, w, 0, 1),
				// linearScale(target.y, 0, h, 0, 1),
				// linearScale(this.go.y, 0, h, 0, 1),
				// linearScale(this.go.angle, -Math.PI, Math.PI, 0, 1),
				// linearScale(target.angle, -Math.PI, Math.PI, 0, 1)
				// linearScale(this.go.angleTo(target), -Math.PI, Math.PI, 0, 1)
			]

			const outputs = await this.brain.forward(inputs)

			const [newAngle, newSpeed] = outputs

			// this.go.angle += linearScale(newAngle, 0, 1, -1, 1)
			// this.go.angle = clamp(this.go.angle, -Math.PI, Math.PI)
			this.go.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// this.go.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// respuesta
			// this.go.angle = this.go.angleTo(target)
		}

		async train() {
			this.go.forward(this.speed)
			await this.seek()
			this.updateFitness()
		}

		// async evaluate() {
		// 	this.go.forward(this.speed)
		// 	await this.seek()
		// }

		updateFitness() {
			const objective = this.go.angleTo(target)
			const error = Math.abs(this.go.angle - objective)
			// this.fitness += 1 / (1 + error)
			this.fitness += 1 / (1 + error)
			this.fitness += 1 / (1 + this.go.distanceTo(target))
			this.fitness += 1 / (1 + this.brain.dag.nodes.size * 0.01)
			this.fitness += 1 / (1 + this.brain.dag.connections.size * 0.01)
		}
	}

	function create() {
		return new Spider()
	}
	let showAll = false
	let spiders: Spider[] = []
	async function onNewGen(population: Spider[]) {
		target.x = w / 2
		target.y = h / 2
	}

	async function onUpdate(population: Spider[]) {
		if (showAll) {
			spiders = population
		} else {
			spiders = [population[0]]
		}
		if (Math.random() > 0.5) target.angle += randomNumber(-1, 1)
		target.forward(3)
	}

	function handleClick(e: MouseEvent) {
		const t = e.target as HTMLElement
		if (!t.closest('.simulator')) return
		target.x = e.offsetX
		target.y = e.offsetY
	}
</script>

<svelte:window on:click={handleClick} />

<Simulator population={20} {create} defaulEvolutionInterval={200} {onUpdate} {onNewGen}>
	<CLabel label="show all">
		<input type="checkbox" on:change={() => (showAll = !showAll)} />
	</CLabel>
	{#each spiders as spider}
		<SpiderComponent go={spider.go} color="var(--accent)" />
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
