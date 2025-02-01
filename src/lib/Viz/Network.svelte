<script lang="ts">
	// import type { Brain } from '$lib/Network/MLPN'
	// import type { Brain } from '$lib/Network/REPINGA'
	// import type { Brain } from '$lib/Network/KANN'
	import type { Brain } from '$lib/Network/RBF_KANN'
	import { CCircle, CGraph, CPath } from '@chasi/ui/graph'
	import { linearScale, randomColor } from '@chasi/ui/utils'
	import TFunction from './TFunction.svelte'

	export let network: Brain
	export let height = 500
	export let width = 800

	const nodeType: Record<string, string> = {}

	for (const key in network.dag.store.nodes) {
		nodeType[key] = randomColor()
	}

	$: graph = !import.meta.env.SSR && network.draw(width, height)

	function nodeSize(n?: number) {
		return n ? linearScale(n, 0, 1, 5, 10) : 4
	}
</script>

{#if graph}
	<div class="s-6">
		<div class="d-flex gap-1 flex-wrap">
			{#each graph.tfunction as { fn, x, y }}
				<TFunction {fn}></TFunction>
			{/each}
		</div>
		<CGraph {height}>
			{#each graph.connectionPositions as [x1, x2, y1, y2]}
				<CPath
					x={[x1, x2]}
					y={[y1, y2]}
					domainX={[0, width]}
					domainY={[height, 0]}
					width="1"
					color="var(--s-2)"
				></CPath>
			{/each}
			{#each graph.nodePositions as [id, { x, y, type }]}
				<CCircle
					domainX={[0, width]}
					domainY={[height, 0]}
					{x}
					{y}
					r={nodeSize(network.lastResult.get(id))}
					strokeWidth="0"
					color={nodeType[type]}
				/>
			{/each}
		</CGraph>
	</div>
{/if}
