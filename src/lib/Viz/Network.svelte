<script lang="ts">
	import type { Brain } from '$lib/KAN/Brain'
	import { CCircle, CGraph, CPath } from '@chasi/ui/graph'

	export let network: Brain
	export let height = 600

	const R = 10

	$: nodes = render(network)

	function render(network: Brain) {
		const units: [number, number][][] = []
		const connections: [number, number, number, number][] = []

		const domainX: [number, number] = [0, network.layers.length]
		const domainY: [number, number] = [0, -1]

		network.layers.forEach((L) => {
			domainY[0] = domainY[0] > L.outputs ? domainY[0] : L.outputs
		})

		network.layers.forEach((L, x) => {
			if (!units[x]) units[x] = []
			units[x + 1] = []
			let yOffset = (domainY[0] - L.inputs) / 2
			if (x === 0) {
				for (let i = 0; i < L.inputs; i++) {
					units[x].push([x, i + yOffset])
				}
			}
			yOffset = (domainY[0] - L.outputs) / 2
			for (let i = 0; i < L.outputs; i++) {
				units[x + 1].push([x + 1, i + yOffset])
			}
		})
		// Configuración de posiciones de conexiones
		units.forEach((current, i) => {
			const next = units[i + 1]
			if (!next) return
			current.forEach((n) => {
				const [x1, y1] = n
				next.forEach((n2) => {
					const [x2, y2] = n2
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
			<!-- <Spline x={(x1 + x2) / 2} y={(y1 + y2) / 2} {spline}></Spline> -->
		{/each}
		{#each nodes.units as layer}
			{#each layer as [x, y]}
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
			<!-- <text {x} {y}>{unit}</text> -->
		{/each}
	</CGraph>
</div>
