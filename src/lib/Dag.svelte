<script lang="ts">
	import { tick } from 'svelte'
	import type { DAG } from './DAG'
	import { randomColor } from '@chasi/ui/utils'

	export let dag: DAG<any>

	let connections: number[][] = []
	let canvas: HTMLDivElement
	const nodeType: Record<string, string> = {}

	for (const key in dag.store.nodes) {
		nodeType[key] = randomColor()
	}

	async function buildConnection() {
		await tick()
		const links = []
		for (const [key] of dag.connections) {
			const [fromId, toId] = key.split('_')
			const source = document.querySelector(`[data-node="${fromId}"]`)
			const target = document.querySelector(`[data-node="${toId}"]`)
			if (!source || !target) continue
			const rootCenter = getcenter(source)
			const targetCenter = getcenter(target)
			links.push([...resolveEdgePoint(rootCenter), ...resolveEdgePoint(targetCenter)])
		}
		connections = links
	}

	function getcenter(el: Element): number[] {
		const { x, width, y, height } = el.getBoundingClientRect()
		return [x + width / 2, y + height / 2]
	}

	function resolveEdgePoint(p: number[]): number[] {
		const { left, top } = canvas.getBoundingClientRect()
		return [p[0] - left, p[1] - top]
	}
	$: if (!import.meta.env.SSR) {
		dag
		buildConnection()
	}
</script>

<div
	class="d-grid justify-between align-center s-6 pa-4 canvas"
	style:--xs-columns="repeat({dag.sorted.length}, auto)"
	bind:this={canvas}
>
	{#each dag.sorted as nodes}
		<div class="layer d-grid align-center">
			{#each nodes as id}
				<div class="node" style:background-color={nodeType[dag.nodes.get(id)]} data-node={id}></div>
			{/each}
		</div>
	{/each}

	<svg>
		{#each connections as link}
			<path
				d="M{link[0]},{link[1]} {link[2]} {link[3]}"
				fill="none"
				stroke="var(--brand)"
				stroke-linejoin="round"
				stroke-linecap="round"
				stroke-width="1"
				stroke-dasharray=""
				vector-effect="non-scaling-stroke"
			/>
		{/each}
	</svg>
</div>

<style>
	.canvas {
		position: relative;
		min-height: 500px;
	}
	.layer {
		height: 100%;
	}
	.node {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background-color: var(--accent);
		z-index: 1;
	}
	svg {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;
		overflow: visible;
	}
</style>
