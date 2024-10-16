<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames } from '@chasi/ui/utils'
	import Spline from '$lib/Viz/Spline.svelte'
	import { linspace } from '$lib/utils'

	const grid = linspace([-1, 1], 20)
	let spline = new BSpline(grid, 3)

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

	$: xResult = spline.evaluate(-0.5)
</script>

<div class="content d-flex gap-4 mb-4">
	<div class="mt-4">
		<CLabel label="mutate control points">
			<input type="checkbox" on:change={toggleMutation} />
		</CLabel>
	</div>
</div>

{xResult}

<div class="d-flex gap-4 align-center">
	<Spline {spline} width={400} height={400} helpers></Spline>
</div>
