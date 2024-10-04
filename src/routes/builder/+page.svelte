<script lang="ts">
	import { Brain } from '$lib/KAN/Brain'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let network = new Brain(3, 2)

	function handleAddLayer() {
		network.addLayer()
		network = network
	}
	function handleForward() {
		const inputSamples = Array.from({ length: network.inputs.length }, () => Math.random())
		network.forward(inputSamples)
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
