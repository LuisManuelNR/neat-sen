<script lang="ts">
	import { CCircle, CGraph, CPath } from '@chasi/ui/graph'
	import type { DAG } from './DAG'
	import { range } from './utils'

	export let dag: DAG
	export let height = 600

	const R = 10
</script>

<div class="s-6">
	<CGraph {height}>
		<!-- <CPath domainX={domain} domainY={domain} {x} {y} color="var(--brand)"></CPath> -->
		{#each dag.sorted as layer, l}
			{@const ys = range([0, height], layer.size)}
			{#each ys as y}
				<CCircle x={l * R} {y} r={R} domainY={[0, height]} strokeWidth="0" color="var(--accent)" />
			{/each}
		{/each}
	</CGraph>
</div>
