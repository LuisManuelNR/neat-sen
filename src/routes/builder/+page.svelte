<script lang="ts">
	import { Brain } from '$lib/KAN/Brain'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber } from '@chasi/ui/utils'

	const INPUT_SIZE = 3
	const OUTPUT_SIZE = 1
	let network = new Brain({
		inputSize: INPUT_SIZE,
		outputSize: OUTPUT_SIZE,
		dataDomain: [0, 10]
	})

	function handleAddLayer() {
		// const splines = Math.round(randomNumber(1, 5))
		// network.addLayer(splines)
		// network = network
	}
	function handleForward() {
		const inputSamples = new Array(INPUT_SIZE).map((v) => randomNumber(0, 10))
		network.forward(inputSamples)
		network = network
	}
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={handleForward}> forward </button>
		<button class="btn" on:click={handleAddLayer}> add layer </button>
	</div>
	<Network {network}></Network>
</div>

<style>
	.card {
		align-content: start;
	}
	.viz {
		--sm-columns: 200px 1fr;
	}
</style>
