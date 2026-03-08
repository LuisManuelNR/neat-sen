<script lang="ts">
	import { Brain } from '$lib/Network'
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
	class Agent {
		brain = new Brain(1, 1)

		train() {
			// const input = randomNumber(domainX[0], domainX[1])
			const input = Math.random()
			const outputs = this.brain.propagate([input])
			const real = realFunction(input)
			const error = Math.abs(outputs[0] - real)
			this.brain.fitness += 1 / (1 + error * error)
		}

		evaluate() {
			return realX.map((n) => {
				const r = this.brain.propagate([n])
				return r[0]
			})
		}
	}

	function create() {
		return new Agent()
	}

	let showAll = false
	function onNewGen(population: Agent[], best: Agent) {
		console.log(best)
		if (showAll) {
			predictedY = population.map((p) => p.evaluate())
		} else {
			predictedY = [best.evaluate()]
		}
	}

	function onUpdate(population: Agent[], best: Agent) {}
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
