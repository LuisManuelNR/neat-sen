<script lang="ts">
	import { RBF } from '$lib/Network/RBF'
	import { CLabel } from '@chasi/ui'
	import { max, runOnFrames } from '@chasi/ui/utils'
	import { linspace } from '$lib/utils'
	import LineChart from '$lib/Viz/LineChart.svelte'

	const DOMAIN = [0, 1] as [number, number]
	let rbf = new RBF(DOMAIN)
	const x = linspace(DOMAIN[0], DOMAIN[1], 1000)
	$: y = x.map((v) => rbf.evaluate(v))

	let stop: (() => void) | undefined

	function toggleMutation() {
		if (stop) {
			stop()
			stop = undefined
			return
		}
		stop = runOnFrames(120, () => {
			rbf.mutate()
			rbf = rbf
		})
	}
	// $: basis = rbf.plotBasis()
	$: maxy = max(y)
</script>

<div class="d-grid gap-4 graph mx-auto">
	<div>
		<div class="content d-flex gap-4 align-center">
			<CLabel label="mutate control points">
				<input type="checkbox" on:change={toggleMutation} />
			</CLabel>
		</div>
		<p>center: {rbf.center}</p>
		<p>sigma: {rbf.sigma}</p>
		<p>weight: {rbf.weight}</p>
		<p class:error={maxy < DOMAIN[0] || maxy > DOMAIN[1]}>max y: {maxy}</p>
	</div>
	<LineChart domainX={DOMAIN} domainY={DOMAIN} charts={[y]} height={500}></LineChart>
</div>

<style>
	.d-grid {
		--xs-columns: 0.4fr 1fr;
	}
</style>
