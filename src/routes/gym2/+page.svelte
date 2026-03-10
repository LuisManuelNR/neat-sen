<script lang="ts">
	import { linearScale, randomNumber } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { Brain } from '$lib/Network'
	import { randomGaussian } from '$lib/utils'

	const MAX_SPEED = 4
	const w = 1000
	const h = 600

	class Spider {
		speed = 3
		brain = new Brain(6, 2)
		go = new GameObject(w, h)
		target = new GameObject(w, h)

		constructor() {
			this.go.x = 100
			this.go.y = h / 2
			this.target.x = w - 100
			this.target.y = h / 2
		}

		seek() {
			const inputs = [
				// linearScale(this.speed, 0, MAX_SPEED, 0, 1),
				// linearScale(target.speed, 0, MAX_SPEED, 0, 1),
				linearScale(this.target.x, 0, w, 0, 1),
				linearScale(this.target.y, 0, h, 0, 1),
				linearScale(this.go.x, 0, w, 0, 1),
				linearScale(this.go.y, 0, h, 0, 1),
				normalizeAngle(this.go.angle),
				normalizeAngle(this.target.angle)
			]

			const outputs = this.brain.propagate(inputs)

			const [newAngle, newSpeed] = outputs

			// this.go.angle += linearScale(newAngle, 0, 1, -1, 1)
			// this.go.angle = clamp(this.go.angle, -Math.PI, Math.PI)
			this.go.angle = denormalizeAngle(newAngle)
			// this.speed = newSpeed
			// this.speed = linearScale(newSpeed, 0, 1, 0, 0.1)
			// console.log(this.speed)
		}

		async train() {
			// if (Math.random() > 0.5) this.target.angle += randomGaussian(0, 0.1)
			// this.target.forward(3)
			this.go.forward(this.speed)
			this.seek()
			this.updateFitness()
		}

		// async evaluate() {
		// 	this.go.forward(this.speed)
		// 	await this.seek()
		// }

		updateFitness() {
			// const objective = this.go.angleTo(this.target)
			// const error = Math.abs(this.go.angle - objective)
			// this.fitness += 1 / (1 + error)
			// this.brain.fitness += 1 / (1 + error * error)
			this.brain.fitness -= 0.01
			const diff = this.go.distanceTo(this.target)
			this.brain.fitness += 1 / (1 + diff * diff)
			// this.fitness += 1 / (1 + this.brain.dag.nodes.size * 0.01)
			// this.fitness += 1 / (1 + this.brain.dag.connections.size * 0.01)
		}
	}

	function create() {
		return new Spider()
	}
	let showAll = false
	let spiders: Spider[] = []
	function onNewGen(population: Spider[]) {
		// target.x = randomNumber(0, w)
		// target.y = randomNumber(0, h)
	}

	function onUpdate(population: Spider[]) {
		if (showAll) {
			spiders = population
		} else {
			spiders = [population[0]]
		}
		// if (Math.random() > 0.5) target.angle += randomGaussian(0, 0.1)
		// target.forward(3)
	}

	function denormalizeAngle(norm: number): number {
		return norm * 2 * Math.PI - Math.PI
	}
	function normalizeAngle(angle: number): number {
		return (angle + Math.PI) / (2 * Math.PI)
	}
</script>

<Simulator population={200} {create} defaulEvolutionInterval={200} {onUpdate} {onNewGen}>
	<CLabel label="show all">
		<input type="checkbox" on:change={() => (showAll = !showAll)} />
	</CLabel>
	{#each spiders as spider}
		<SpiderComponent go={spider.go} color="var(--accent)" />
		<GameObjectComponent go={spider.target}>
			<div class="target brand"></div>
		</GameObjectComponent>
	{/each}
</Simulator>

<style>
	.target {
		display: grid;
		place-content: center;
		pointer-events: none;
	}
</style>
