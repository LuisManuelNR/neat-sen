<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { runOnFrames, linearScale, randomNumber, max, min } from '@chasi/ui/utils'
	import SpiderComponent from './Spider.svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { clamp } from '$lib/utils'

	let seeAll = false
	const MAX_SPEED = 6
	const w = 1000
	const h = 600
	class Spider extends Genome {
		speed = MAX_SPEED
		prevDistance = 0
		score = 0
		go = new GameObject()
		target = new GameObject()
		distanceToTarget = 0

		constructor() {
			super(4, 1)
			this.go.x = randomNumber(50, w - 50)
			this.go.y = randomNumber(50, h - 50)
			this.target.x = randomNumber(50, w - 50)
			this.target.y = randomNumber(50, h - 50)
			this.speed = MAX_SPEED
		}

		seek() {
			this.distanceToTarget = this.go.distanceTo(this.target)

			this.go.x = clamp(this.go.x, 0, w)
			this.go.y = clamp(this.go.y, 0, h)
			// this.go.angle = clamp(this.go.angle, -Math.PI, Math.PI)

			this.inputs = [
				// linearScale(this.target.y - this.go.y, -h, h, 0, 1),
				// linearScale(this.target.x - this.go.x, -w, w, 0, 1)
				linearScale(this.go.x, 0, w, 0, 1),
				linearScale(this.go.y, 0, h, 0, 1),
				linearScale(this.target.x, 0, w, 0, 1),
				linearScale(this.target.y, 0, h, 0, 1)
				// linearScale(this.go.angle, -Math.PI, Math.PI, 0, 1)
				// linearScale(this.speed, 0, MAX_SPEED, 0, 1),
				// linearScale(this.distanceToTarget, 0, w, 0, 1)
				// linearScale(this.go.angleTo(this.target), -Math.PI, Math.PI, 0, 1)
			]

			this.outputs = this.brain.forward(this.inputs)

			const [newAngle, newSpeed] = this.outputs

			// this.speed = linearScale(newSpeed, 0, 1, 0, MAX_SPEED)
			this.go.angle = linearScale(newAngle, 0, 1, -Math.PI, Math.PI)
			// respuesta
			// this.go.angle = this.go.angleTo(this.target)
		}

		train() {
			this.seek()
			this.updateFitness()
			if (this.distanceToTarget < 25) {
				this.updateTarget()
			}
			this.go.forward(this.speed)
		}

		evaluate() {
			this.seek()
			if (this.distanceToTarget < 25) {
				this.updateTarget()
			}
			this.go.forward(this.speed)
		}

		updateFitness() {
			const objective = this.go.angleTo(this.target)
			const error = Math.abs(this.outputs[0] - objective)
			this.fitness += 1 / (1 + error)

			// if (this.distanceToTarget < this.prevDistance) {
			// 	this.fitness += 1 / (1 + this.distanceToTarget)
			// } else if (this.distanceToTarget > this.prevDistance) {
			// 	this.fitness -= 1 / (1 + this.distanceToTarget)
			// }

			// this.prevDistance = this.distanceToTarget
		}

		updateTarget() {
			this.score++
			if (this.score > 20) {
				this.score = 0
				this.target.x = randomNumber(50, w - 50)
				this.target.y = randomNumber(50, h - 50)
			}
		}
	}

	function create() {
		return new Spider()
	}
</script>

<Simulator let:best population={50} {create} defaulEvolutionInterval={200}>
	<SpiderComponent
		go={best.go}
		color="oklab({100 / (1 + best.distanceToTarget)} -0.04 -0.12 / 1)"
	/>
	<GameObjectComponent go={best.target}>
		<div class="target brand">{best.score}</div>
	</GameObjectComponent>
</Simulator>

<style>
	.target {
		display: grid;
		place-content: center;
	}
</style>
