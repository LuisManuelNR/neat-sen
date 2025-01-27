<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames } from '@chasi/ui/utils'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'
	import { CGraph, CPath } from '@chasi/ui/graph'
	import Spline from '$lib/Viz/Spline.svelte'

	const DOMAIN = [0, 1] as [number, number]
	// let spline = new BSpline(linspace(0, 1, 10), 3)
	let spline = new BSpline(2, 1)
	const x = linspace(DOMAIN[0], DOMAIN[1], 1000)
	$: y = x.map((v) => spline.evaluate(v))

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
	$: basis = spline.plotBasis()
</script>

<div class="d-grid gap-4 graph mx-auto">
	<div>
		<div class="content d-flex gap-4 align-center">
			<CLabel label="mutate control points">
				<input type="checkbox" on:change={toggleMutation} />
			</CLabel>
		</div>

		<LineChart charts={[y]} height={500}></LineChart>
	</div>
	<div>
		<p>Basis functions</p>
		<LineChart charts={basis} height={500}></LineChart>
	</div>
</div>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
