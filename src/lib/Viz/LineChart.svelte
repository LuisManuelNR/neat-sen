<script lang="ts">
	import { linspace } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'
	import { max, min } from '@chasi/ui/utils'

	export let y: number[] = []
	export let x: number[] = []
	export let height = 50

	$: _x = x.length ? x : linspace([0, y.length], y.length)
	$: domainX = [min(_x), max(_x)] as [number, number]
	$: domainY = [min(y), max(y)] as [number, number]
</script>

<div class="spline">
	<CGraph {height}>
		{#if y.length > 1}
			<CPath {domainX} {domainY} x={_x} {y} color="var(--accent)"></CPath>
			<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
			<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
		{/if}
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
