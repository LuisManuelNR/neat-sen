<script lang="ts">
	import { Brain } from '$lib/KAN/Brain'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let inputsSize = 3
	let outputsSize = 2

	let inputs = Array.from({ length: inputsSize }, () => Math.random())
	let outputs = Array.from({ length: outputsSize }, () => 0)
	let network = new Brain(inputsSize, outputsSize)

	function handleAddLayer() {
		network.addLayer()
		network = network
	}
	function handleForward() {
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
	<Network {inputs} {outputs} {network}></Network>
</div>

<style>
	.card {
		align-content: start;
	}
	.viz {
		--sm-columns: 200px 1fr;
	}
</style>
