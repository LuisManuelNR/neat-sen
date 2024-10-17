<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames, randomColor, min, max } from '@chasi/ui/utils'
	import Spline from '$lib/Viz/Spline.svelte'
	import { linspace } from '$lib/utils'
	import { CAxisX, CAxisY, CGraph, CPath } from '@chasi/ui/graph'

	let spline = new BSpline(10)

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
</script>

<div class="d-grid gap-4 graph mx-auto">
	<div>
		<div class="content d-flex gap-4 align-center">
			<CLabel label="mutate control points">
				<input type="checkbox" on:change={toggleMutation} />
			</CLabel>
		</div>

		<Spline {spline} width={500} height={500} helpers></Spline>
	</div>
	<div>
		<!-- <p>Basis functions</p>
		<CGraph height={500}>
			{#each basis as b}
				<CPath {domainX} {domainY} x={spline.knots} y={b} color={randomColor()}></CPath>
			{/each}
			<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
			<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
		</CGraph> -->
	</div>
</div>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
