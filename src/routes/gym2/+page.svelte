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
	target.x = w / 2 - 300
	target.y = h / 2
	let initialPos = { x: w / 2, y: h / 2 }
	class Spider extends Genome {
		speed = MAX_SPEED
		prevDistance = 0
		score = 0
		go = new GameObject(w, h)
		distanceToTarget = 0

		constructor() {
			super(5, 1, 7)
			this.go.x = initialPos.x
			this.go.y = initialPos.y
			this.speed = MAX_SPEED
			this.go.angle = randomNumber(-Math.PI, Math.PI)
		}

		async seek() {
			const inputs = [
				// linearScale(target.y - this.go.y, -h, h, 0, 1),
				// linearScale(target.x - this.go.x, -w, w, 0, 1),
				linearScale(this.go.x, 0, w, 0, 1),
				linearScale(this.go.y, 0, h, 0, 1),
				linearScale(target.x, 0, w, 0, 1),
				linearScale(target.y, 0, h, 0, 1),
				linearScale(this.go.angle, -Math.PI, Math.PI, 0, 1)
				// linearScale(this.go.angleTo(target), -Math.PI, Math.PI, 0, 1)
			]

			const outputs = await this.brain.forward(inputs)

			const [newAngle, newSpeed] = outputs

			this.go.angle += linearScale(newAngle, 0, 1, -1, 1)
			// this.go.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// respuesta
			// this.go.angle = this.go.angleTo(target)
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
			this.fitness += 2 / (1 + error)
			this.fitness += 1 / (1 + this.go.distanceTo(target))
			this.fitness += 1 / (1 + this.brain.dag.nodes.size * this.brain.dag.connections.size)
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
		if (frames % 10 === 0) {
			// initialPos = { x: randomNumber(50, w - 50), y: randomNumber(50, h - 50) }
			target.x = randomNumber(50, w - 50)
			target.y = randomNumber(50, h - 50)
		}
	}

	async function onUpdate(population: Spider[]) {
		frames++
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
