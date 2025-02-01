<script lang="ts">
	import { Genome } from '$lib/NEAT/Simulator'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { linearScale, max, min, randomNumber } from '@chasi/ui/utils'

	$: realX = linspace(0, 1, 100)
	$: realY = realX.map((n) => realFunction(n))
	$: domainX = [min(realX), max(realX)]
	$: domainY = [min(realY), max(realY)]

	let predictedY: number[][] = []

	function realFunction(x: number) {
		return linearScale(Math.sin(10 * x), -1, 1, 0, 1)
	}
	class Agent extends Genome {
		constructor() {
			super(1, 1)
		}

		async train() {
			const input = randomNumber(domainX[0], domainX[1])
			const outputs = await this.brain.forward([input])
			const real = realFunction(input)
			const error = Math.abs(outputs[0] - real)
			this.fitness += 1 / (1 + error)
			this.fitness += 1 / (1 + this.brain.dag.nodes.size * 0.001)
			this.fitness += 1 / (1 + this.brain.dag.connections.size * 0.001)
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
	async function onNewGen(population: Agent[], best: Agent) {
		if (showAll) {
			predictedY = await Promise.all(population.map((p) => p.evaluate()))
		} else {
			predictedY = [await best.evaluate()]
		}
	}

	async function onUpdate(population: Agent[], best: Agent) {}
</script>

<Simulator population={50} {create} defaulEvolutionInterval={40} {onNewGen} {onUpdate}>
	<div class="d-grid gap-4">
		<div>
			<p>target</p>
			<LineChart {domainX} {domainY} charts={[realY]} height={400}></LineChart>
		</div>
		<div>
			<div class="d-flex align-center gap-2">
				<p>output</p>
				<CLabel label="show all">
					<input type="checkbox" on:change={() => (showAll = !showAll)} />
				</CLabel>
			</div>
			<LineChart {domainX} {domainY} charts={predictedY} height={400}></LineChart>
		</div>
	</div>
</Simulator>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
