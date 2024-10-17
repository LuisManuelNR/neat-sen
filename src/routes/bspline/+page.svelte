<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames, randomColor } from '@chasi/ui/utils'
	import Spline from '$lib/Viz/Spline.svelte'
	import { linspace } from '$lib/utils'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'
	import { max, min } from 'mathjs'
	import LineChart from '$lib/Viz/LineChart.svelte'

	const domain = [0, 1] as [number, number]
	const resolution = 100
	const x = linspace(domain, resolution)

	let spline = new BSpline(20, 3)
	const basis = spline.plotBasis(resolution)
	const domainY = [min(basis.flat()), max(basis.flat())] as [number, number]

	let stop: (() => void) | undefined

	function toggleMutation() {
		if (stop) {
			stop()
			stop = undefined
			return
		}
		stop = runOnFrames(60, () => {
			spline.mutate()
			spline = spline
		})
	}

	$: xResult = spline.evaluate(-1)
</script>

<div class="content d-flex gap-4 mb-4">
	<div class="mt-4">
		<CLabel label="mutate control points">
			<input type="checkbox" on:change={toggleMutation} />
		</CLabel>
	</div>
</div>

{xResult}

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
