<script lang="ts">
	import { BSpline } from '$lib/Network/cells/Cells'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames } from '@chasi/ui/utils'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'

	const DOMAIN = [-1, 1] as [number, number]
	let spline = new BSpline()
	const x = linspace(DOMAIN[0], DOMAIN[1], 1000)
	$: y = x.map((v) => {
		spline.evaluate(v)
		return spline.value
	})

	$: domainY = [-1, 1]

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

		<LineChart {domainY} domainX={DOMAIN} charts={[y]} height={500}></LineChart>
	</div>
	<div>
		<p>Basis functions</p>
		<!-- <LineChart charts={basis} height={500}></LineChart> -->
	</div>
</div>

<style>
	.d-grid {
		--xs-columns: 1fr 1fr;
	}
</style>
