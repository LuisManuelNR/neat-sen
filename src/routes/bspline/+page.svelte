<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames } from '@chasi/ui/utils'
	import Spline from '$lib/Viz/Spline.svelte'

	let points = 20
	let spline = new BSpline(points)

	let stop: (() => void) | undefined

	function toggleMutation() {
		if (stop) {
			stop()
			stop = undefined
			return
		}
		stop = runOnFrames(30, () => {
			spline.mutate()
			spline = spline
		})
	}

	$: result = spline.evaluate(Math.random())
</script>

<div class="content d-flex gap-4 mb-4">
	<div class="mt-4">
		<CLabel label="mutate control points">
			<input type="checkbox" on:change={toggleMutation} />
		</CLabel>
	</div>
</div>

<div class="d-flex gap-4 align-center">
	<Spline {spline} width={400} height={400} testPoints={100} helpers></Spline>
	<p>{result}</p>
</div>
