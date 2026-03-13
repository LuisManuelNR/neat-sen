<script lang="ts">
	import type { Brain } from '$lib/Network'

	export let network: Brain | undefined = undefined
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

	function render(net?: Brain) {
		if (!ctx || !net) return
		if (net.layers.length === 0) return

		ctx.clearRect(0, 0, width, height)

		const hMargin = 60
		const vMargin = 60

		const maxNodeRadius = 18
		const minNodeRadius = 6

		const layerCount = net.layers.length
		const maxNodes = net.nodes.length

		const nodeRadius = Math.max(
			minNodeRadius,
			Math.min(maxNodeRadius, (height - vMargin * 2) / maxNodes)
		)

		const layerSpacing = layerCount > 1 ? (width - hMargin * 2) / (layerCount - 1) : 0

		const positions = new Map<number, { x: number; y: number }>()

		// ===== POSICIONES =====
		net.layers.forEach((nodes, li) => {
			const nodeCount = nodes.length

			const x = hMargin + li * layerSpacing

			const totalHeight = nodeCount > 1 ? (nodeCount - 1) * nodeRadius * 3 : 0

			const startY = (height - totalHeight) / 2

			nodes.forEach((node, ni) => {
				const y = nodeCount === 1 ? height / 2 : startY + ni * nodeRadius * 3

				positions.set(node.id, { x, y })
			})
		})

		// ===== EDGES =====
		ctx.lineCap = 'round'

		for (const edge of net.edges) {
			const p1 = positions.get(edge.source)
			const p2 = positions.get(edge.target)

			if (!p1 || !p2) continue

			const weight = edge.cell.value

			ctx.beginPath()
			ctx.moveTo(p1.x, p1.y)
			ctx.lineTo(p2.x, p2.y)

			ctx.lineWidth = 1 + Math.min(Math.abs(weight), 1) * 6

			ctx.strokeStyle = weight >= 0 ? '#2ecc71' : '#e74c3c'

			ctx.stroke()
		}

		// ===== NODES =====
		for (const node of net.nodes) {
			const pos = positions.get(node.id)
			if (!pos) continue

			ctx.beginPath()
			ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2)

			ctx.fillStyle = '#fff'
			ctx.fill()

			ctx.strokeStyle = '#000'
			ctx.lineWidth = 2
			ctx.stroke()

			const innerRadius = nodeRadius * Math.min(Math.abs(node.cell.value), 1)

			ctx.beginPath()
			ctx.arc(pos.x, pos.y, innerRadius * 0.85, 0, Math.PI * 2)

			ctx.fillStyle = node.cell.value >= 0 ? '#2ecc71' : '#e74c3c'

			ctx.fill()

			// pintar key del nodo encima
			// ctx.fillStyle = '#333'
			// ctx.font = '10px monospace'
			// ctx.textAlign = 'center'
			// ctx.fillText(node.cell.value.toFixed(2), pos.x, pos.y)
		}
	}
</script>

<canvas bind:this={canvas} use:setup style="height: {height}px;"></canvas>

<style>
	canvas {
		width: 100%;
	}
</style>
