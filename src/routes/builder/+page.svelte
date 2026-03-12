<script lang="ts">
	import { Brain } from '$lib/Network'
	import { runEveryFrames } from '$lib/utils'
	import Network from '$lib/Viz/Network.svelte'
	import { randomNumber, runOnFrames } from '@chasi/ui/utils'

	let inputsSize = 2
	let outputsSize = 1
	let network = new Brain(inputsSize, outputsSize)
	let forwardResult: number[] = []

	function addNode() {
		network.addRandomNode()
		network = network
	}
	function addConnection() {
		network.addRandomConnection()
		network = network
	}
	function randomize() {
		inputsSize = Math.floor(randomNumber(1, 5))
		outputsSize = Math.floor(randomNumber(1, 5))
		network = new Brain(inputsSize, outputsSize)
	}

	function mutate() {
		network.mutate()
		network = network
	}
	function propagate() {
		const repinga = Array(inputsSize).fill(2)
		forwardResult = network.evaluate(repinga)
		network = network
		console.log(forwardResult)

		// const clone = network.clone()
		// const clonefff = clone.evaluate(repinga)
		// console.log('PROPAGATE ES IGUAL?')
		// console.log('original', forwardResult)
		// console.log('clone', clonefff)
	}
	let stopSimulation: number | undefined
	let i = 0
	function stop() {
		if (stopSimulation) clearInterval(stopSimulation)
		stopSimulation = undefined
		i = 0
	}
	function simulate() {
		stopSimulation = setInterval(() => {
			i++
			const repinga = Array(inputsSize).fill(Math.sin(i))
			forwardResult = network.evaluate(repinga)
			network = network
		}, 50)
	}
</script>

<div class="viz d-grid gap-4">
	<div class="card d-grid gap-4">
		<button class="btn" on:click={addNode}> add node </button>
		<button class="btn" on:click={addConnection}> add connection </button>
		<button class="btn" on:click={randomize}> randomize </button>
		<button class="btn" on:click={mutate}> mutate </button>
		<button class="btn" on:click={propagate}> propagate </button>
		{#if stopSimulation}
			<button class="btn error" on:click={stop}> stop </button>
		{:else}
			<button class="btn success" on:click={simulate}> simulate </button>
		{/if}
	</div>
	<Network {network}></Network>
</div>
<p>forward: {JSON.stringify(forwardResult, null, 2)}</p>

<style>
	.viz {
		--sm-columns: 200px 1fr;
	}
</style>
