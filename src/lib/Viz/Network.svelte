<script lang="ts">
	import { onMount } from 'svelte'
	import type { Brain } from '$lib/Network'

	export let network: Brain | undefined = undefined
	export let height = 500

	let width = 800
	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D

	let frame = 0

	const positions = new Map<number, { x: number; y: number }>()
	const velocities = new Map<number, { x: number; y: number }>()

	const repulsion = 4000
	const springLength = 60
	const springStrength = 0.02
	const damping = 0.6

	function setup(canvas: HTMLCanvasElement) {
		const dpr = window.devicePixelRatio || 1

		width = canvas.clientWidth
		const h = canvas.clientHeight

		canvas.width = width * dpr
		canvas.height = h * dpr

		ctx = canvas.getContext('2d')!
		ctx.scale(dpr, dpr)
	}

	function ensureNodes(net: Brain) {
		for (const node of net.nodes) {
			if (positions.has(node.id)) continue

			positions.set(node.id, {
				x: Math.random() * width,
				y: Math.random() * height
			})

			velocities.set(node.id, { x: 0, y: 0 })
		}
	}

	function layoutStep(net: Brain) {
		// const inputs = net.inputIds
		// const outputs = net.outputIds

		// const cx = width / 2
		// const cy = height / 2

		// const inputRadius = Math.min(width, height) * 0.45
		// const outputRadius = Math.min(width, height) * 0.08

		// ===== REPULSION =====

		for (const a of net.nodes) {
			const pa = positions.get(a.id)!
			const va = velocities.get(a.id)!

			for (const b of net.nodes) {
				if (a.id === b.id) continue

				const pb = positions.get(b.id)!

				let dx = pa.x - pb.x
				let dy = pa.y - pb.y

				const dist = Math.sqrt(dx * dx + dy * dy) + 0.01

				const force = repulsion / (dist * dist)

				va.x += (dx / dist) * force
				va.y += (dy / dist) * force
			}
		}

		// ===== SPRINGS =====

		for (const edge of net.edges) {
			const p1 = positions.get(edge.source)!
			const p2 = positions.get(edge.target)!

			const v1 = velocities.get(edge.source)!
			const v2 = velocities.get(edge.target)!

			let dx = p2.x - p1.x
			let dy = p2.y - p1.y

			const dist = Math.sqrt(dx * dx + dy * dy) + 0.01

			const force = (dist - springLength) * springStrength

			const fx = (dx / dist) * force
			const fy = (dy / dist) * force

			v1.x += fx
			v1.y += fy

			v2.x -= fx
			v2.y -= fy
		}

		// ===== INTEGRATION =====

		for (const node of net.nodes) {
			const pos = positions.get(node.id)!
			const vel = velocities.get(node.id)!

			// if (!inputs.has(node.id) && !outputs.has(node.id)) {
			pos.x += vel.x
			pos.y += vel.y

			vel.x *= damping
			vel.y *= damping
			// }
		}

		// // ===== ANCHOR OUTPUTS (CENTRO) =====

		// net.outputIds.forEach((id, i) => {
		// 	const angle = (i / net.outputIds.length) * Math.PI * 2

		// 	const pos = positions.get(id)!
		// 	const vel = velocities.get(id)!

		// 	pos.x = cx + Math.cos(angle) * outputRadius
		// 	pos.y = cy + Math.sin(angle) * outputRadius

		// 	vel.x = 0
		// 	vel.y = 0
		// })

		// // ===== ANCHOR INPUTS (ANILLO EXTERIOR) =====

		// net.inputIds.forEach((id, i) => {
		// 	const angle = (i / net.inputIds.length) * Math.PI * 2

		// 	const pos = positions.get(id)!
		// 	const vel = velocities.get(id)!

		// 	pos.x = cx + Math.cos(angle) * inputRadius
		// 	pos.y = cy + Math.sin(angle) * inputRadius

		// 	vel.x = 0
		// 	vel.y = 0
		// })
	}

	function render(net: Brain) {
		if (!ctx) return

		ctx.clearRect(0, 0, width, height)

		const nodeRadius = 10

		// edges
		for (const edge of net.edges) {
			const p1 = positions.get(edge.source)
			const p2 = positions.get(edge.target)

			if (!p1 || !p2) continue

			const weight = edge.cell.value

			ctx.beginPath()

			// if (p2.x < p1.x) {
			// 	const mx = (p1.x + p2.x) / 2
			// 	const my = (p1.y + p2.y) / 2 - 40
			// 	ctx.moveTo(p1.x, p1.y)
			// 	ctx.quadraticCurveTo(mx, my, p2.x, p2.y)
			// } else {
			ctx.moveTo(p1.x, p1.y)
			ctx.lineTo(p2.x, p2.y)
			// }

			ctx.lineWidth = 1 + Math.min(Math.abs(weight), 1) * 5
			ctx.strokeStyle = weight >= 0 ? '#2ecc71' : '#e74c3c'

			ctx.stroke()
		}

		// nodes
		for (const node of net.nodes) {
			const pos = positions.get(node.id)
			if (!pos) continue

			ctx.beginPath()
			ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2)

			ctx.fillStyle = '#2C303D'
			ctx.fill()

			ctx.strokeStyle = '#fff'
			ctx.lineWidth = 2
			ctx.stroke()

			const inner = nodeRadius * Math.min(Math.abs(node.cell.value), 1)

			ctx.beginPath()
			ctx.arc(pos.x, pos.y, inner, 0, Math.PI * 2)

			ctx.fillStyle = node.cell.value >= 0 ? '#2ecc71' : '#e74c3c'
			ctx.fill()
		}
	}

	function loop() {
		if (network) {
			ensureNodes(network)
			layoutStep(network)
			render(network)
		}

		frame = requestAnimationFrame(loop)
	}

	onMount(() => {
		frame = requestAnimationFrame(loop)
		return () => {
			cancelAnimationFrame(frame)
		}
	})
</script>

<canvas bind:this={canvas} use:setup style="height:{height}px;"></canvas>

<style>
	canvas {
		width: 100%;
	}
</style>
