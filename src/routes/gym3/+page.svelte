<script lang="ts">
	import CSVLoader from '$lib/CSVLoader.svelte'
	import type { Agent } from '$lib/NEAT/Simulator'
	import { Brain } from '$lib/Network'
	import { linspace, randomIndex } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'
	import { linearScale, max, min, randomColor } from '@chasi/ui/utils'

	const W_SIZE = 10
	let train: number[] = []
	let domain: [number, number] = [-1, 1]
	let realDomain: [number, number] = [0, 0]
	let testChunk: number[] = []

	function onload(data: number[]) {
		const minD = min(data)
		const maxD = max(data)
		realDomain = [minD, maxD]
		train = interval(data, 60, (p) => linearScale(p, minD, maxD, -1, 1))
		testChunk = randomChunk()
	}

	function chunk(start: number, size: number, data: number[]) {
		const startIndex = Math.min(start, data.length - size)
		return data.slice(startIndex, startIndex + size)
	}

	function interval(data: number[], step = 1, transform: (d: number) => number) {
		const result = []
		for (let i = 0; i < data.length; i += step) {
			const d = transform(data[i])
			result.push(d)
		}
		return result
	}

	function randomChunk() {
		const start = randomIndex(train)
		return chunk(start, W_SIZE + 1, train)
	}

	class Adivino implements Agent {
		brain = new Brain(W_SIZE, 1)

		train() {
			const input = testChunk.slice(0, -1)
			const [pred] = this.brain.evaluate(input)

			const real = testChunk[testChunk.length - 1]
			const error = Math.abs(real - pred)
			this.brain.fitness += 10 / (1 + error)
		}
	}

	function create() {
		return new Adivino()
	}

	const domainX: [number, number] = [0, W_SIZE * 2]
	let reals: number[] = []
	let predictions: number[] = []
	let index = 0
	function onUpdate(_: Adivino[], best: Adivino) {
		testChunk = randomChunk()
		// const input = chunk(index, W_SIZE, train)
		// for (let i = 0; i < W_SIZE; i++) {
		// 	const [pred] = best.brain.evaluate(input)
		// 	input.push(pred)
		// 	input.shift()
		// }
		// reals = chunk(index, W_SIZE * 2, train)
		// predictions = input
		// index = (index + 1) % (train.length - W_SIZE * 2)
	}

	function onNewGen(_: Adivino[], best: Adivino) {
		const input = chunk(index, W_SIZE, train)
		for (let i = 0; i < W_SIZE; i++) {
			const [pred] = best.brain.evaluate(input)
			input.push(pred)
			input.shift()
		}
		reals = chunk(index, W_SIZE * 2, train)
		predictions = input
		index = (index + 1) % (train.length - W_SIZE * 2)
	}
</script>

<CSVLoader {onload}></CSVLoader>

<Simulator population={300} {create} defaulEvolutionInterval={200} {onNewGen} {onUpdate}>
	<LineChart domainY={domain} charts={[train]} height={400}></LineChart>
	<CGraph height={400}>
		<!-- reales -->
		<CPath
			{domainX}
			domainY={domain}
			x={linspace(0, reals.length, reals.length)}
			y={reals}
			color="#1aecbe"
		></CPath>
		<!-- prediction -->
		<CPath
			{domainX}
			domainY={domain}
			x={linspace(W_SIZE, W_SIZE * 2, predictions.length)}
			y={predictions}
			color="#b01aec"
		></CPath>

		<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
		<CAxisY {domain} ticksNumber={4}></CAxisY>
	</CGraph>
</Simulator>
