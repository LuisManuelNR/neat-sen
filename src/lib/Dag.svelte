<script lang="ts">
	import { CCircle, CGraph, CPath } from '@chasi/ui/graph'
	import type { DAG } from './DAG'

	export let dag: DAG
	export let height = 600

	const R = 10

	$: nodes = render(dag)

	function render(g: DAG) {
		const units: Map<number, [number, number]> = new Map()
		const connections: [number, number, number, number][] = []
		const sorted = g.garph()

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
					connections.push([x1, x2, y1, y2]) // Añadimos la conexión
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
		{#each nodes.connections as [x1, x2, y1, y2]}
			<CPath
				domainX={nodes.domainX}
				domainY={nodes.domainY}
				x={[x1, x2]}
				y={[y1, y2]}
				color="var(--brand)"
			></CPath>
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
		{/each}
	</CGraph>
</div>
