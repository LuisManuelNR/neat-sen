<script lang="ts">
	import { CGraph, CPath } from '@chasi/ui/graph'

	export let fn: { plot: (resolution: number) => { x: number[]; y: number[] } }
	export let width = 50
	export let height = 50

	const margin = 0
	const domain = [0, 1] as [number, number]
	$: p = fn.plot(30)
</script>

<div class="spline" style:width="{width}px">
	<CGraph
		{height}
		marginBottom={margin}
		marginLeft={margin}
		marginRight={margin}
		marginTop={margin}
	>
		<CPath domainX={domain} domainY={domain} x={p.x} y={p.y} color="var(--brand)"></CPath>
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
