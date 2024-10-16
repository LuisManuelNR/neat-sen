<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { linspace } from '$lib/utils'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'
	import { max, min, randomColor } from '@chasi/ui/utils'

	const domain = [-1, 1] as [number, number]
	const grid = linspace(domain, 7)
	const x = linspace(domain, 1000)

	const spline = new BSpline(grid, 3)
	const basis = spline.basis(x, grid)
	// console.log(basis.length)
	// const domainY = [min(basis[0]), max(basis[0])] as [number, number]
</script>

<div class="graph mx-auto">
	<CGraph height={500}>
		{#each basis as b}
			<CPath domainX={domain} domainY={domain} {x} y={b} color={randomColor()}></CPath>
		{/each}
		<CAxisX {domain} ticksNumber={4}></CAxisX>
		<CAxisY {domain} ticksNumber={4}></CAxisY>
	</CGraph>
</div>

<style>
	.graph {
		width: 500px;
	}
</style>
