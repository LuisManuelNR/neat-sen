<script lang="ts">
	import { onMount } from 'svelte'
	import type { Brain, Edge } from '$lib/Network'
	import { randomGaussian } from '$lib/utils'

	export let network: Brain | undefined = undefined
	export let height = 500

	let width = 800
	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D

	let frame = 0

	const positions = new Map<number, { x: number; y: number }>()
	const velocities = new Map<number, { x: number; y: number }>()

	const repulsion = 500
	const springLength = 6
	const springStrength = 0.02
	const damping = 0.1

	let edges = new Set<Edge>()

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
				x: width / 2 + randomGaussian(0, 10),
				y: height / 2 + randomGaussian(0, 10)
			})

			velocities.set(node.id, { x: 0, y: 0 })
		}
	}

	function layoutStep(net: Brain) {
		edges = new Set()
		// const inputs = net.inputIds
		// const outputs = net.outputIds

		// const cx = width / 2
		// const cy = height / 2

		// const inputRadius = Math.min(width, height) * 0.45
		// const outputRadius = Math.min(width, height) * 0.08

		// ===== REPULSION =====

		for (const a of net.nodes) {
			edges = edges.union(a.outgoing)

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

		for (const edge of edges) {
			const p1 = positions.get(edge.fromid)!
			const p2 = positions.get(edge.toid)!

			const v1 = velocities.get(edge.fromid)!
			const v2 = velocities.get(edge.toid)!

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
	}

	function render(net: Brain) {
		if (!ctx) return

		ctx.clearRect(0, 0, width, height)

		const nodeRadius = 10

		// edges
		for (const edge of edges) {
			const p1 = positions.get(edge.fromid)
			const p2 = positions.get(edge.toid)

			if (!p1 || !p2) continue

			const weight = edge.cell.value

			ctx.beginPath()

			// if (p2.x < p1.x) {
			// const mx = (p1.x + p2.x) / 2
			// const my = (p1.y + p2.y) / 2 - 40
			// ctx.moveTo(p1.x, p1.y)
			// ctx.quadraticCurveTo(mx, my, p2.x, p2.y)
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

			if (!node.incoming.size) {
				ctx.strokeStyle = '#7291f9'
			} else if (!node.outgoing.size) {
				ctx.strokeStyle = '#1ae4a7'
			} else {
				ctx.strokeStyle = '#fff'
			}
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
		border: 1px solid var(--s-1);
		border-radius: var(--size-1);
	}
</style>
