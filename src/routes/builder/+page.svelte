<script lang="ts">
	import Dag from '$lib/Dag.svelte'
	// import { Brain } from '$lib/Network/KANN'
	import { Brain } from '$lib/Network/MLPN'
	import { runEveryFrames } from '$lib/utils'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let inputsSize = 2
	let outputsSize = 1
	let network = new Brain(inputsSize, outputsSize)
	let inputs = genRandomInputs()
	let forwardResult: number[] = []
	function genRandomInputs() {
		return Array.from({ length: inputsSize }, () => Math.random())
	}
	async function handleForward() {
		forwardResult = await network.forward(inputs)
		network = network
	}

	function randomizeNetwork() {
		inputsSize = Math.floor(randomNumber(1, 5))
		outputsSize = Math.floor(randomNumber(1, 5))
		network = new Brain(inputsSize, outputsSize)
		inputs = genRandomInputs()
	}

	let stopmutation: (() => void) | undefined
	function hanldeStop() {
		if (stopmutation) stopmutation()
		stopmutation = undefined
	}
	function handleMutate() {
		stopmutation = runEveryFrames(
			() => 60,
			async () => {
				network.mutate()
				forwardResult = await network.forward(inputs)
				network = network
			}
		)
	}
	function addNode() {
		network.addNode()
		network = network
	}
	function removeNode() {
		network.removeNode()
		network = network
	}
	function addConnection() {
		network.addEdge()
		network = network
	}
	function removeConnection() {
		network.removeEdge()
		network = network
		console.log(network)
	}
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={handleForward}> forward </button>
		<button class="btn" on:click={addNode}> add node </button>
		<button class="btn" on:click={removeNode}> remove node </button>
		<button class="btn" on:click={addConnection}> add connection </button>
		<button class="btn" on:click={removeConnection}> remove connection </button>
		<button class="btn" on:click={randomizeNetwork}> randomize </button>
		{#if stopmutation}
			<button class="btn error" on:click={hanldeStop}> stop mutation </button>
		{:else}
			<button class="btn success" on:click={handleMutate}> mutate </button>
		{/if}
		<p>forward: {JSON.stringify(forwardResult, null, 2)}</p>
	</div>
	<Network {network}></Network>
</div>

<style>
	.card {
		align-content: start;
	}
	.viz {
		--sm-columns: auto 1fr;
	}
</style>
