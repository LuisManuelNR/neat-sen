<script lang="ts">
	import { range } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'
	import { max, min } from '@chasi/ui/utils'

	export let y: number[] = []
	export let x: number[] = []
	export let width = 50
	export let height = 50

	$: domainX = [min(x), max(x)] as [number, number]
	$: domainY = [min(y), max(y)] as [number, number]
</script>

<div class="spline" style:width="{width}px">
	<CGraph {height}>
		<CPath {domainX} {domainY} {x} {y} color="var(--accent)"></CPath>
		<CAxisX domain={domainX} ticksNumber={5}></CAxisX>
		<CAxisY domain={domainY} ticksNumber={5}></CAxisY>
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
