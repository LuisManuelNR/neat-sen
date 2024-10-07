<script lang="ts">
	import type { Brain } from '$lib/KAN/Brain'
	import Spline from './Spline.svelte'

	export let inputs: number[] = []
	export let outputs: number[] = []
	export let network: Brain

	$: columns = network.layers.length + 2 // inputs and outpurs
</script>

<div
	class="d-grid justify-between align-center s-6 pa-4"
	style:--xs-columns="repeat({columns}, 50px)"
>
	<!-- inputs -->
	<div class="d-flex flex-column gap-2">
		{#each inputs as value}
			<div class="value">
				{value.toFixed(2)}
			</div>
		{/each}
	</div>
	<!-- layers -->
	{#each network.layers as layer}
		<div class="d-flex flex-column gap-2">
			{#each layer.splines as spline}
				<Spline {spline}></Spline>
			{/each}
		</div>
	{/each}
	<!-- outputs -->
	<div class="d-flex flex-column gap-2">
		{#each outputs as value}
			<div class="value">
				{value.toFixed(2)}
			</div>
		{/each}
	</div>
</div>

<style>
	.value {
		display: grid;
		place-content: center;
		border-radius: 50%;
		aspect-ratio: 1;
		background-color: var(--s-4);
	}
</style>
