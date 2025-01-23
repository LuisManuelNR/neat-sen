<script lang="ts">
	import Dag from '$lib/Dag.svelte'
	import { Brain } from '$lib/KAN/Brain'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let inputsSize = 2
	let outputsSize = 1
	let network = new Brain(inputsSize, outputsSize)
	let forwardResult: number[] = []

	async function handleForward() {
		// const inputs = Array.from({ length: inputsSize }, () => Math.random())
		forwardResult = await network.forward([1, 1])
	}

	function randomizeNetwork() {
		inputsSize = Math.floor(randomNumber(1, 5))
		outputsSize = Math.floor(randomNumber(1, 5))
		network = new Brain(inputsSize, outputsSize)
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
	function logSorted() {
		console.log(network.dag.sorted)
		const emptyConnections = []
		for (const [id, deps] of network.dag.connections) {
			if (deps.size === 0) emptyConnections.push(id)
		}
		console.log(emptyConnections)
	}
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={handleForward}> forward </button>
		<button class="btn" on:click={addNode}> add node </button>
		<button class="btn" on:click={removeNode}> remove node </button>
		<button class="btn" on:click={addConnection}> add connection </button>
		<button class="btn" on:click={randomizeNetwork}> randomize </button>
		<button class="btn" on:click={logSorted}> log sorted </button>
		{#if stopmutation}
			<button class="btn error" on:click={hanldeStop}> stop mutation </button>
		{:else}
			<button class="btn success" on:click={handleMutate}> mutate </button>
		{/if}
		<p>forward: {JSON.stringify(forwardResult, null, 2)}</p>
	</div>
	<Dag dag={network.dag}></Dag>
</div>

<style>
	.card {
		align-content: start;
	}
	.viz {
		--sm-columns: 200px 1fr;
	}
</style>
