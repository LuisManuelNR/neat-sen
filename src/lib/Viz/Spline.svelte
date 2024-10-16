<script lang="ts" context="module">
	const domain = [0, 1] as [number, number]
</script>

<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { linspace } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY, CCircle } from '@chasi/ui/graph'

	export let spline: BSpline
	export let width = 50
	export let height = 50
	export let helpers = false

	const margin = helpers ? 40 : 0
	$: x = linspace(domain, 100)
	$: y = x.map(spline.evaluate)
</script>

<div class="spline" style:width="{width}px">
	<CGraph
		{height}
		marginBottom={margin}
		marginLeft={margin}
		marginRight={margin}
		marginTop={margin}
	>
		<CPath domainX={domain} domainY={domain} {x} {y} color="var(--brand)"></CPath>
		{#if helpers}
			{@const points = linspace(domain, spline.coeficients.length)}
			{#each spline.coeficients as point, i}
				<CCircle
					x={points[i]}
					y={point}
					domainX={domain}
					domainY={domain}
					r="3"
					strokeWidth="0"
					color="var(--accent)"
				/>
			{/each}
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
