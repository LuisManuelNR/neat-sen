<script lang="ts" context="module">
	const domain = [0, 1] as [number, number]
</script>

<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'

	export let spline: BSpline
	export let width = 50
	export let height = 50
	export let helpers = false

	const margin = helpers ? 40 : 0
	$: p = spline.plotSpline(30)
</script>

<div class="spline" style:width="{width}px">
	<CGraph
		{height}
		marginBottom={margin}
		marginLeft={margin}
		marginRight={margin}
		marginTop={margin}
	>
		<CPath domainX={domain} domainY={domain} x={p[0]} y={p[1]} color="var(--brand)"></CPath>
		{#if helpers}
			<CAxisX {domain} ticksNumber={5}></CAxisX>
			<CAxisY {domain} ticksNumber={5}></CAxisY>
		{/if}
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
