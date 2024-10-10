<script lang="ts">
	import { BSpline } from '$lib/KAN/BSpline'
	import { CLabel } from '@chasi/ui'
	import { runOnFrames } from '@chasi/ui/utils'
	import Spline from '$lib/Viz/Spline.svelte'
	import { range } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'

	let points = 4
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
</script>

<div class="content d-flex gap-4 mb-4">
	<div class="mt-4">
		<CLabel label="mutate control points">
			<input type="checkbox" on:change={toggleMutation} />
		</CLabel>
	</div>
</div>

<div class="d-flex gap-4 align-center">
	<Spline {spline} width={400} height={400} helpers></Spline>
</div>

<!-- <h3 class="my-4">funciones bases</h3>
<div class="d-grid gap-4">
	{#each Array.from({ length: 11 }, (v, i) => i) as t}
		{@const evt = t - 3}
		<div>
			<p class="f-size-4 brand-text"><b>t</b> = {evt}</p>
			<LineChart y={spline.baseFunctions(evt)} height={400}></LineChart>
		</div>
	{/each}
</div> -->

<style>
	.d-grid {
		--xs-columns: repeat(3, 400px);
	}
</style>
