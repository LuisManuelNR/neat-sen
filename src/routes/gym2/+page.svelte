<script lang="ts">
	import { linearScale, randomNumber } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { Brain } from '$lib/Network'
	import { clamp, randomGaussian } from '$lib/utils'
	import type { Simulation } from '$lib/NEAT/Simulator'

	const MAX_SPEED = 4
	const w = 1000
	const h = 600

	class Spider {
		speed = 0
		prevDistance = w
		brain = new Brain(5, 2)
		go = new GameObject(w, h)
		target = new GameObject(w, h)
		touched = false

		constructor() {
			this.reset()
		}

		reset() {
			this.go.x = w / 2
			this.go.y = h / 2
			this.go.angle = randomNumber(-Math.PI, Math.PI)

			this.target.angle = this.go.angle
			this.target.x = this.go.x
			this.target.y = this.go.y
			this.target.forward(randomNumber(400, w))
			this.target.angle = randomNumber(-Math.PI, Math.PI)
		}

		seek() {
			const dx = linearScale(this.target.x - this.go.x, -w, w, -1, 1)
			const dy = linearScale(this.target.y - this.go.y, -h, h, -1, 1)
			const distance = linearScale(this.go.distanceTo(this.target), 0, w, -1, 1)
			const angleToTarget = linearScale(this.go.angleTo(this.target), -Math.PI, Math.PI, -1, 1)

			const inputs = [dx, dy, distance, angleToTarget, this.speed / MAX_SPEED]

			const outputs = this.brain.propagate(inputs)
			const [turn, accel] = outputs
			this.go.angle = linearScale(turn, -1, 1, -Math.PI, Math.PI)

			this.speed = linearScale(accel, -1, 1, 0, MAX_SPEED)
			this.speed = clamp(this.speed, 0, MAX_SPEED)
		}

		train() {
			// if (Math.random() > 0.5) this.target.angle += randomGaussian(0, 0.1)
			// this.target.forward(1)
			this.go.forward(this.speed)
			this.seek()
			this.updateFitness()
		}

		updateFitness() {
			const distance = this.go.distanceTo(this.target)
			if (distance < 60) {
				this.brain.fitness += 1
				this.reset()
			} else {
				this.brain.fitness += 1 / (1 + distance * distance)
			}
		}
	}

	function create() {
		return new Spider()
	}
	let showAll = false
	let spiders: Spider[] = []
	function onNewGen(sim: Simulation) {}

	function onUpdate(sim: Simulation) {
		if (showAll) {
			spiders = sim.population
		} else if (sim.best) {
			sim.best.train()
			spiders = [sim.best]
		}
	}
</script>

<CLabel label="show all" class="mb-4">
	<input type="checkbox" bind:checked={showAll} />
</CLabel>
<Simulator population={200} {create} defaulEvolutionInterval={400} {onUpdate} {onNewGen}>
	{#each spiders as spider, i}
		<SpiderComponent go={spider.go} color="hsl(199.91deg 91.67% {spider.brain.fitness * 0.1}%)">
			<!-- {spider.go.distanceTo(spider.target)} -->
		</SpiderComponent>
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
