<script lang="ts">
	import type { Brain } from '$lib/KAN/Brain'
	import { CCircle, CGraph, CPath } from '@chasi/ui/graph'
	import Spline from './Spline.svelte'
	import type { BSpline } from '$lib/KAN/BSpline'

	export let network: Brain
	export let height = 600

	const R = 10

	$: nodes = render(network)

	function render(network: Brain) {
		const units: Map<number, [number, number]> = new Map()
		const connections: [number, number, number, number, BSpline][] = []
		const sorted = network.dag.garph()

		const domainX: [number, number] = [0, sorted.length - 1]
		const domainY: [number, number] = [0, 0]

		sorted.forEach((level, x) => {
			domainY[0] = domainY[0] > level.length ? domainY[0] : level.length
		})

		sorted.forEach((level, x) => {
			const levelHeight = level.length - 1
			const yOffset = (domainY[0] - levelHeight) / 2

			level.forEach((node, y) => {
				const xPos = x
				const yPos = y + yOffset
				units.set(node.from, [xPos, yPos])
			})
		})

		// Configuración de posiciones de conexiones
		sorted.forEach((level) => {
			level.forEach((node) => {
				const [x1, y1] = units.get(node.from)!
				node.to.forEach((toId) => {
					const [x2, y2] = units.get(toId)!
					connections.push([x1, x2, y1, y2, network.splines.get(node.from)!]) // Añadimos la conexión
				})
			})
		})

		return {
			units,
			connections,
			domainX,
			domainY
		}
	}
</script>

<div class="s-6">
	<CGraph {height}>
		{#each nodes.connections as [x1, x2, y1, y2, spline]}
			<CPath
				domainX={nodes.domainX}
				domainY={nodes.domainY}
				x={[x1, x2]}
				y={[y1, y2]}
				color="var(--brand)"
			></CPath>
			<!-- <Spline x={(x1 + x2) / 2} y={(y1 + y2) / 2} {spline}></Spline> -->
		{/each}
		{#each nodes.units as [_, [x, y]]}
			<CCircle
				{x}
				{y}
				r={R}
				domainX={nodes.domainX}
				domainY={nodes.domainY}
				strokeWidth="0"
				color="var(--accent)"
			/>
			<!-- <text {x} {y}>{unit}</text> -->
		{/each}
	</CGraph>
</div>
