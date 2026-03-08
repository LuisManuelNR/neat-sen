<script lang="ts">
	import type { Brain } from '$lib/Network'

	export let network: Brain
	export let height = 500

	let width = 800
	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D
	$: canvas && render(network)

	function setup(canvas: HTMLCanvasElement) {
		const dpr = window.devicePixelRatio || 1

		// Obtener tamaño visual del canvas
		width = canvas.clientWidth
		const height = canvas.clientHeight

		// Ajustar tamaño real del canvas
		canvas.width = width * dpr
		canvas.height = height * dpr
		ctx = canvas.getContext('2d')!
		ctx.scale(dpr, dpr)
	}

	function render(net?: Brain, debugMode?: boolean) {
		if (!ctx) return
		if (!net) return
		if (net?.sorted.length === 0) return

		ctx.clearRect(0, 0, width, height)

		const layerCount = net.sorted.length
		const hMargin = 50
		const vMargin = 50
		const maxNodeRadius = 20
		const minNodeRadius = 6

		// Escalas para nodos si hay muchos
		const scaleX =
			layerCount > 1
				? Math.min(1, (width - 2 * hMargin) / ((layerCount - 1) * maxNodeRadius * 3))
				: 1
		const maxNodesInLayer = Math.max(...net.sorted.map((l) => l.size))
		const scaleY =
			maxNodesInLayer > 1
				? Math.min(1, (height - 2 * vMargin) / ((maxNodesInLayer - 1) * maxNodeRadius * 3))
				: 1
		const nodeRadius = Math.max(minNodeRadius, maxNodeRadius * Math.min(scaleX, scaleY))
		const layerSpacing = layerCount > 1 ? (width - 2 * hMargin) / (layerCount - 1) : 0

		// Calcular posiciones
		const positions = new Map<number, { x: number; y: number }>()
		net.sorted.forEach((layer, li) => {
			const x = hMargin + layerSpacing * li
			const nodeCount = layer.size
			const nodeSpacing = nodeCount > 1 ? (height - 2 * vMargin) / (nodeCount - 1) : 0

			Array.from(layer).forEach((node, ni) => {
				const y =
					vMargin + (nodeCount > 1 ? nodeSpacing * ni : (height - 2 * vMargin) / 2 + vMargin)
				positions.set(node.id, { x, y })
			})
		})

		ctx.lineWidth = 2

		// Dibujar edges
		for (const edge of net.edges) {
			const p1 = positions.get(edge.source)
			const p2 = positions.get(edge.target)
			if (!p1 || !p2) continue

			ctx.beginPath()
			ctx.moveTo(p1.x, p1.y)
			ctx.lineTo(p2.x, p2.y)

			ctx.lineWidth = 1 + Math.min(Math.abs(edge.cell.value), 1) * 8
			ctx.strokeStyle = edge.cell.value >= 0 ? '#2ecc71' : '#e74c3c'
			ctx.stroke()
		}

		// Dibujar nodos
		for (const node of net.graph.keys()) {
			const pos = positions.get(node.id)
			if (!pos) continue

			// Nodo externo
			ctx.beginPath()
			ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2)
			ctx.fillStyle = '#fff'
			ctx.fill()
			ctx.strokeStyle = '#000'
			ctx.lineWidth = 2
			ctx.stroke()

			// Nodo interno: radio proporcional al valor del nodo
			const innerRadius = nodeRadius * Math.min(Math.abs(node.cell.value), 1)
			ctx.beginPath()
			ctx.arc(pos.x, pos.y, innerRadius * 0.9, 0, Math.PI * 2)
			ctx.fillStyle = '#000'
			ctx.fill()

			// Debug: mostrar ID del nodo
			if (debugMode) {
				ctx.fillStyle = '#fff'
				ctx.font = '20px monospace'
				ctx.textAlign = 'center'
				ctx.fillText(`${node.id} = ${node.cell.value}`, pos.x, pos.y - 25)
			}
		}
	}
</script>

<canvas bind:this={canvas} use:setup style="height: {height}px;"></canvas>

<style>
	canvas {
		width: 100%;
	}
</style>
