<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { linspace } from '$lib/utils'
	import Spline from '$lib/Viz/Spline.svelte'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'
	import { max, min, randomColor } from '@chasi/ui/utils'

	const domain = [-1, 1] as [number, number]
	const resolution = 100
	const x = linspace(domain, resolution)

	const spline = new BSpline(10, 3)
	const basis = spline.plotBasis(resolution)
	const domainY = [min(basis.flat()), max(basis.flat())] as [number, number]
</script>

<div class="d-grid gap-4 graph mx-auto">
	<CGraph height={500}>
		{#each basis as b}
			<CPath domainX={domain} {domainY} {x} y={b} color={randomColor()}></CPath>
		{/each}
		<CAxisX {domain} ticksNumber={4}></CAxisX>
		<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
	</CGraph>
	<Spline {spline} width={500} height={500} helpers></Spline>
</div>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
