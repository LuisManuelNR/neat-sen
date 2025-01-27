<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { linearScale } from '@chasi/ui/utils'

	const realX = linspace(0, 1, 100)
	const realY = realX.map((n) => realFunction(n))
	let predictedY: number[][] = []
	function realFunction(x: number) {
		const v = Math.sin(x * 10)
		// const v = Math.sqrt(Math.pow(x, 2) * Math.sin(x * 3))
		return linearScale(v, -1, 1, 0, 1)
		// return Math.pow(x, 2)
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
	let showAll = false
	async function onNewGen(population: Agent[]) {
		if (showAll) {
			predictedY = await Promise.all(population.map((p) => p.evaluate()))
		} else {
			predictedY = [await population[0].evaluate()]
		}
	}
	// async function onUpdate(population: Agent[]) {
	// 	predictedY = await population[0].evaluate()
	// }
</script>

<Simulator population={50} {create} defaulEvolutionInterval={10} {onNewGen}>
	<div class="d-grid gap-4">
		<div>
			<p>target</p>
			<LineChart charts={[realY]} height={400}></LineChart>
		</div>
		<div>
			<div class="d-flex align-center gap-2">
				<p>output</p>
				<CLabel label="show all">
					<input type="checkbox" on:change={() => (showAll = !showAll)} />
				</CLabel>
			</div>
			<LineChart charts={predictedY} height={400}></LineChart>
		</div>
	</div>
</Simulator>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
