<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'

	const realX = Array.from({ length: 20 }, (v, i) => i)
	const realY = realX.map((n) => realFunction(n))

	function realFunction(x: number) {
		return Math.pow(x, 2) * Math.sin(x * 0.2)
	}
	class Agent extends Genome {
		constructor() {
			super(1, 2, 1)
		}

		train() {
			const inputs = [Math.random()]
			const outputs = this.brain.forward(inputs)

			const real = realFunction(inputs[0])
			const error = Math.abs(outputs[0] - real)
			this.fitness += 1 / (1 + error)
		}

		evaluate() {
			return realX.map((n) => this.brain.forward([n])[0])
		}
	}

	function create() {
		return new Agent()
	}
</script>

<Simulator let:best population={50} {create} defaulEvolutionInterval={10}>
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
