<script lang="ts">
	import { Brain } from '$lib/KAN/Brain'
	import { range } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import Network from '$lib/Viz/Network.svelte'
	import Spline from '$lib/Viz/Spline.svelte'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let inputsSize = 1
	let outputsSize = 1
	let network = new Brain(inputsSize, outputsSize)

	function handleAddLayer() {
		network.addLayer()
		network = network
	}
	function handleForward() {
		const inputs = Array.from({ length: inputsSize }, () => Math.random())
		console.log(inputs)
		network.forward(inputs)
		network = network
	}

	function randomizeNetwork() {
		network = new Brain(Math.floor(randomNumber(1, 5)), Math.floor(randomNumber(1, 5)))
	}

	let stopmutation: (() => void) | undefined
	function hanldeStop() {
		if (stopmutation) stopmutation()
		stopmutation = undefined
	}
	function handleMutate() {
		stopmutation = runOnFrames(60, () => {
			network.mutate()
			network = network
		})
	}

	const x = range([0, 1], 100)
	$: y = x.map((n) => network.forward([n])[0])
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={handleForward}> forward </button>
		<button class="btn" on:click={handleAddLayer}> add layer </button>
		<button class="btn" on:click={randomizeNetwork}> randomize </button>
		{#if stopmutation}
			<button class="btn" on:click={hanldeStop}> stop mutation </button>
		{:else}
			<button class="btn" on:click={handleMutate}> mutate </button>
		{/if}
	</div>
	<Network {network}></Network>
	<LineChart {x} {y}></LineChart>
</div>

<style>
	.card {
		align-content: start;
	}
	.viz {
		--sm-columns: 200px 1fr;
	}
</style>
