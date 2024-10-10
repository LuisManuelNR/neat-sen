<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CNotifier } from '@chasi/ui'
	import { randomNumber } from '@chasi/ui/utils'

	const dataset = Array.from({ length: 10 }, () => [randomNumber(0, 1), randomNumber(0, 1)])
	const realY = dataset.map((n) => realFunction(n))

	function realFunction(xs: number[]) {
		// return xs[0] * xs[1]
		return Math.atan2(xs[0], xs[1])
	}
	class Agent extends Genome {
		constructor() {
			super(2, 1)
		}

		train() {
			this.inputs = [Math.random(), Math.random()]
			this.outputs = this.brain.forward(this.inputs)

			const real = realFunction(this.inputs)
			const error = Math.abs(this.outputs[0] - real)
			this.fitness += 1 / (1 + error)
		}

		evaluate() {
			return dataset.map((n) => this.brain.forward(n)[0])
		}
	}

	function create() {
		return new Agent()
	}
</script>

<Simulator let:best population={50} {create} defaulEvolutionInterval={100}>
	<div class="d-grid gap-4">
		<div>
			<p>output</p>
			<LineChart y={best.evaluate()} height={400}></LineChart>
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
