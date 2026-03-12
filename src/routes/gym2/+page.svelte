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
		lastDistance = 0

		constructor() {
			this.reset()
		}

		reset() {
			this.go.x = w / 2
			this.go.y = h / 2
			this.go.angle = randomNumber(-Math.PI, Math.PI)

			this.target.x = w / 2
			this.target.y = h / 2
			this.target.angle = this.go.angle

			this.target.forward(-300)
		}

		seek() {
			const dx = linearScale(this.target.x - this.go.x, -w, w, -1, 1)
			const dy = linearScale(this.target.y - this.go.y, -h, h, -1, 1)
			const distance = linearScale(this.go.distanceTo(this.target), 0, w, -1, 1)
			const angleDiff = this.go.lookingAt(this.target)

			const inputs = [dx, dy, angleDiff, distance, this.speed / MAX_SPEED]

			const outputs = this.brain.evaluate(inputs)
			const [turn, accel] = outputs
			this.go.angle += turn * 0.1
			this.speed += accel * 0.1
			this.go.forward(this.speed)
		}

		train() {
			this.seek()
			this.updateFitness()
		}

		updateFitness() {
			const angleDiff = this.go.lookingAt(this.target)
			const distance = this.go.distanceTo(this.target)

			const angleScore = (angleDiff + 1) / 2

			const progress = this.lastDistance - distance

			this.brain.fitness += progress * angleScore * 0.1

			this.lastDistance = distance

			if (distance < 60 && angleScore > 0.9) {
				this.brain.fitness += 1
				this.reset()
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
<Simulator population={500} {create} defaulEvolutionInterval={400} {onUpdate} {onNewGen}>
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
