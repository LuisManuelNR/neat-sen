<script lang="ts">
	import { linspace } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'
	import { max, min, randomColor } from '@chasi/ui/utils'

	export let height = 50
	export let charts: number[][] = []
	export let domainX: number[] = [0, 1]
	export let domainY: number[] = [0, 1]
	$: x = linspace(domainX[0], domainX[1], charts[0].length)
</script>

<div class="spline">
	<CGraph {height}>
		{#each charts as chart}
			<CPath {domainX} {domainY} {x} y={chart} color={randomColor()}></CPath>
		{/each}
		<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
		<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
