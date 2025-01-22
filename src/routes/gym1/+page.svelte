<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { randomNumber, linearScale } from '@chasi/ui/utils'

	const realX = Array.from({ length: 20 }, () => Math.random())
	const realY = realX.map((n) => realFunction(n))

	function realFunction(x: number) {
		return Math.pow(x, 2)
	}
	class Agent extends Genome {
		constructor() {
			super(1, 1)
			this.brain.forward([0.1]).then((r) => {
				console.log('Output:', r)
			})
			this.brain.forward([0.2]).then((r) => {
				console.log('Output:', r)
			})
			this.brain.forward([0.3]).then((r) => {
				console.log('Output:', r)
			})
		}

		async train() {
			this.inputs = [Math.random()]
			this.outputs = await this.brain.forward(this.inputs)

			const real = realFunction(this.inputs[0])
			const error = Math.abs(this.outputs[0] - real)
			this.fitness += 1 / (1 + error)
		}

		evaluate() {
			// return Promise.all(
			// 	realX.map(async (n) => {
			// 		// console.log('Input:', n)
			// 		const r = await this.brain.forward([n])
			// 		// console.log('Output:', r)
			// 		return r[0]
			// 	})
			// )
		}
	}

	function create() {
		return new Agent()
	}
</script>

<Simulator let:best population={1} {create} defaulEvolutionInterval={100}>
	<div class="d-grid gap-4">
		<div>
			<p>output</p>
			<!-- {#await best.evaluate() then ys}
				<LineChart y={ys} height={400}></LineChart>
			{/await} -->
		</div>
		<div>
			<p>target</p>
			<LineChart y={realY} height={400}></LineChart>
		</div>
	</div>
</Simulator>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
