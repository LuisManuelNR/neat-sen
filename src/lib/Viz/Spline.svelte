<script lang="ts" context="module">
	const POINTS = 20
	const HEIGHT = 50
	const DOMAIN: [number, number] = [-1, 1]
	const MARGIN = 0
</script>

<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { range } from '$lib/utils'
	import { CGraph, CPath, CCircle } from '@chasi/ui/graph'

	export let spline: BSpline

	let x = range([-1, 1], POINTS)
	$: y = x.map((n) => spline.evaluate(n))
</script>

<div class="spline">
	<CGraph
		height={HEIGHT}
		marginLeft={MARGIN}
		marginRight={MARGIN}
		marginTop={MARGIN}
		marginBottom={MARGIN}
	>
		{#each spline.controlPoints as point}
			<CCircle x={point[0]} y={point[1]} domainX={DOMAIN} domainY={DOMAIN} r="3" strokeWidth="1"
			></CCircle>
		{/each}
		<CPath domainX={DOMAIN} domainY={DOMAIN} {x} {y} color="var(--accent)"></CPath>
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
