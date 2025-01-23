<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'

	const realX = linspace(0, 1, 100)
	const realY = realX.map((n) => realFunction(n))
	let predictedY: number[] = []
	function realFunction(x: number) {
		// return Math.pow(x, 2) * Math.sin(x * 2)
		return Math.pow(x, 2)
	}
	class Agent extends Genome {
		constructor() {
			super(1, 1)
		}

		async train() {
			const inputs = [Math.random()]
			const outputs = await this.brain.forward(inputs)

			const real = realFunction(inputs[0])
			const error = Math.abs(outputs[0] - real)
			this.fitness += 1 / (1 + error)
		}

		async evaluate() {
			return Promise.all(
				realX.map(async (n) => {
					const r = await this.brain.forward([n])
					return r[0]
				})
			)
		}
	}

	function create() {
		return new Agent()
	}
	async function onNewGen(population: Agent[]) {
		predictedY = await population[0].evaluate()
	}
	async function onUpdate(population: Agent[]) {
		predictedY = await population[0].evaluate()
	}
</script>

<Simulator population={1} {create} defaulEvolutionInterval={10} {onNewGen}>
	<div class="d-grid gap-4">
		<div>
			<p>target</p>
			<LineChart charts={[realY]} height={400}></LineChart>
		</div>
		<div>
			<p>output</p>
			<LineChart charts={[predictedY]} height={400}></LineChart>
		</div>
	</div>
</Simulator>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
