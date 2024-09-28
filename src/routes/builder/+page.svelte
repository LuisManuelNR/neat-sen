<script lang="ts">
	import { Brain } from '$lib/KAN/Brain'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber } from '@chasi/ui/utils'

	let network = new Brain({
		inputSize: 3,
		outputSize: 2,
		dataDomain: [0, 10]
	})

	function handleAddLayer() {
		network.addLayer()
		network = network
	}
	function handleForward() {
		const inputSamples = Array.from({ length: network.inputs.length }, () => randomNumber(0, 10))
		network.forward(inputSamples)
		network = network
	}

	function randomizeNetwork() {
		network = new Brain({
			inputSize: Math.floor(randomNumber(1, 5)),
			outputSize: Math.floor(randomNumber(1, 5)),
			dataDomain: [0, 10]
		})
	}
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={handleForward}> forward </button>
		<button class="btn" on:click={handleAddLayer}> add layer </button>
		<button class="btn" on:click={randomizeNetwork}> randomize </button>
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
