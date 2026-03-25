<script lang="ts">
	import { linearScale, randomNumber } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { Brain } from '$lib/Network'
	import { clamp, randomGaussian } from '$lib/utils'
	import type { Agent, Simulation } from '$lib/NEAT/Simulator'
	import { Clock } from '$lib/Network/cells/Cells'

	const MAX_SPEED = 4
	const w = 1000
	const h = 600

	class Spider implements Agent {
		speed = MAX_SPEED
		brain = new Brain(5, 1)
		go = new GameObject(w, h)
		target = new GameObject(w, h)

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

			this.target.forward(randomNumber(-250, -350))
		}

		train(istrain = true) {
			const angleScore = this.go.lookingAt(this.target)
			const as = linearScale(angleScore, -1, 1, 0, 1)
			const sx = linearScale(this.go.x, 0, w, 0, 1)
			const sy = linearScale(this.go.y, 0, h, 0, 1)
			const tx = linearScale(this.target.x, 0, w, 0, 1)
			const ty = linearScale(this.target.y, 0, h, 0, 1)
			const inputs = [as, sx, sy, tx, ty]

			const outputs = this.brain.evaluate(inputs)
			const [turn] = outputs

			if (turn > 0.7) {
				this.go.angle += 0.2
			}
			if (turn < 0.3) {
				this.go.angle -= 0.2
			}
			// if (accel > 0.5) {
			// 	this.speed += 0.2
			// } else {
			// 	this.speed -= 0.2
			// }
			// this.speed = clamp(this.speed, 0, MAX_SPEED)
			this.go.forward(this.speed)

			// fitness
			if (istrain) {
				this.updateFitness()
			} else {
				const distance = this.go.distanceTo(this.target)
				if (distance < 60) {
					this.reset()
				}
			}
		}

		updateFitness() {
			const angleScore = this.go.lookingAt(this.target) // [-1,1]
			const distance = this.go.distanceTo(this.target)

			// fitness incremental
			this.brain.fitness += 60 / (1 + distance)
			this.brain.fitness += linearScale(angleScore, -1, 1, 0, 1)

			// objetivo alcanzado
			if (distance < 60 && angleScore > 0.9) {
				this.brain.fitness += 10
				this.reset()
			}

			// penalización ligera por complejidad
			// const complexityPenalty = 0.0005 * (this.brain.nodes.length + this.brain.edges.length)
			// this.brain.fitness -= complexityPenalty
		}
	}

	function create() {
		return new Spider()
	}
	let showAll = false
	let spiders: Spider[] = []

	function onUpdate(population: Spider[], best: Spider) {
		if (showAll) {
			spiders = population.slice()
		} else {
			best.train(false)
			spiders = [best]
		}
	}
</script>

<CLabel label="show all" class="mb-4">
	<input type="checkbox" bind:checked={showAll} />
</CLabel>
<Simulator population={300} {create} defaulEvolutionInterval={200} {onUpdate}>
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
