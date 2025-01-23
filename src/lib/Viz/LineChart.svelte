<script lang="ts">
	import { linspace } from '$lib/utils'
	import { CGraph, CPath, CAxisX, CAxisY } from '@chasi/ui/graph'
	import { max, min } from '@chasi/ui/utils'

	export let height = 50
	export let domainX: [number, number] = [0, 1]
	export let domainY: [number, number] = [0, 1]
</script>

<div class="spline">
	<CGraph {height}>
		<slot {CPath} />
		<CAxisX domain={domainX} ticksNumber={4}></CAxisX>
		<CAxisY domain={domainY} ticksNumber={4}></CAxisY>
	</CGraph>
</div>

<style>
	.spline {
		outline: 1px solid var(--s-1);
		border-radius: 5px;
	}
</style>
