<script lang="ts">
	import CSVLoader from '$lib/CSVLoader.svelte'
	import type { Agent } from '$lib/NEAT/Simulator'
	import { Brain } from '$lib/Network'
	import { createStandardizer, linspace, randomIndex } from '$lib/utils'
	import Simulator from '$lib/Viz/Simulator.svelte'
	import { CLabel } from '@chasi/ui'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'
	import { linearScale } from '@chasi/ui/utils'

	const W_SIZE = 1
	const OUTPUT_SIZE = 1

	const scaler = createStandardizer()

	let real: number[] = []
	let domainY: [number, number] = [-1, 1]
	let domainX: [number, number] = [-1, 1]

	let train: number[] = []
	let testChunk: number[] = []

	let stdMin = 0
	let stdMax = 0

	function onload(data: number[]) {
		const step = 60
		const min = Math.min(...data)
		const max = Math.max(...data)

		real = interval(data, step)
		domainX = [0, real.length]
		domainY = [min, max]

		const stdData = scaler.standardize(data)
		stdMin = Math.min(...stdData)
		stdMax = Math.max(...stdData)
		train = interval(stdData, step, (p) => linearScale(p, stdMin, stdMax, -1, 1))
		testChunk = randomChunk()
		predict()
	}

	function chunk(start: number, size: number, data: number[]) {
		const startIndex = Math.min(start, data.length - size)
		return data.slice(startIndex, startIndex + size)
	}

	function interval(data: number[], step = 1, transform: (d: number) => number = (n) => n) {
		const result = []
		for (let i = 0; i < data.length; i += step) {
			const d = transform(data[i])
			result.push(d)
		}
		return result
	}

	function randomChunk() {
		const start = randomIndex(train)
		return chunk(start, W_SIZE + OUTPUT_SIZE, train)
	}

	function computeError(predictions: number[], real: number[]) {
		let error = 0
		for (let i = 0; i < predictions.length; i++) {
			error += Math.abs(real[i] - predictions[i])
		}
		return error / predictions.length
	}

	class Adivino implements Agent {
		brain = new Brain(W_SIZE, OUTPUT_SIZE)

		train() {
			const input = testChunk.slice(0, W_SIZE)
			const real = testChunk.slice(W_SIZE, W_SIZE + OUTPUT_SIZE)

			const predictions = this.brain.evaluate(input)
			const error = computeError(predictions, real)

			this.brain.fitness += 10 / (1 + error)
		}
	}

	function create() {
		return new Adivino()
	}

	let index = 0
	let predictions: number[] = []
	let best = new Adivino()

	function onUpdate(_: Adivino[], _best: Adivino) {
		testChunk = randomChunk()
	}

	function onNewGen(_: Adivino[], _best: Adivino) {
		best = _best
	}

	function predict() {
		const input = chunk(index, W_SIZE, train)
		const denormPrediction = best.brain
			.evaluate(input)
			.map((v) => linearScale(v, -1, 1, stdMin, stdMax))

		predictions = [real[index + W_SIZE], ...scaler.destandardize(denormPrediction)]
		requestAnimationFrame(predict)
	}
</script>

<CSVLoader {onload}></CSVLoader>

<CLabel>
	<input type="range" min="0" max={real.length} bind:value={index} />
</CLabel>

<Simulator population={200} {create} defaulEvolutionInterval={200} {onUpdate} {onNewGen}>
	<CGraph height={400} allowPanX allowZoomX marginLeft="60">
		<!-- reales -->
		<CPath
			{domainX}
			{domainY}
			x={linspace(domainX[0], domainX[1], real.length)}
			y={real}
			color="#1aecbe"
		></CPath>
		<!-- prediction -->
		<CPath
			{domainX}
			{domainY}
			x={linspace(index + W_SIZE, index + W_SIZE + predictions.length - 1, predictions.length)}
			y={predictions}
			color="#b01aec"
		></CPath>

		<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
		<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
	</CGraph>
</Simulator>
