<script lang="ts" context="module">
	const DOMAIN: [number, number] = [0, 1]
</script>

<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { range } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'

	export let spline: BSpline
	export let width = 50
	export let height = 50
	export let testPoints = 20
	export let helpers = false

	let x = range([0, 1], testPoints)
	$: y = x.map((n) => spline.evaluate(n))
</script>

<div class="spline" style:width="{width}px">
	<CGraph {height}>
		<CPath domainX={DOMAIN} domainY={DOMAIN} {x} {y} color="var(--brand)"></CPath>
		{#if helpers}
			<CAxisX domain={DOMAIN} ticksNumber={5}></CAxisX>
			<CAxisY domain={DOMAIN} ticksNumber={5}></CAxisY>
		{/if}
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
