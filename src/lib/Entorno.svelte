<script lang="ts">
	import { runOnFrames, randomNumber, isInside } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'
	import Target from './Target.svelte'
	import Bouning from './Bouning.svelte'

	export let w = 800
	export let h = 600

	let x = 200
	let y = 200
	let dir = 0
	const speed = 5
	const turnRate = 10
	const keysPressed: Record<string, boolean> = {}

	let xT = randomNumber(0, 700)
	let yT = randomNumber(0, 500)
	let spiderBound: [number, number][] = []
	let targetBound: [number, number][] = []
	function update() {
		const rad = (Math.PI / 180) * (dir - 90)
		if (keysPressed['w']) {
			x += Math.cos(rad) * speed
			y += Math.sin(rad) * speed
			if (x < 0) x = 0
			if (y < 0) y = 0
			if (x > w) x = w
			if (y > h) y = h
		}
		if (keysPressed['a']) {
			dir -= turnRate
		}
		if (keysPressed['d']) {
			dir += turnRate
		}
		spiderBound = createBoundPoints(8, [x, y], 50)
		targetBound = createBoundPoints(4, [xT, yT], 25)
		if (isInsidePoly(spiderBound, targetBound)) {
			xT = randomNumber(0, 700)
			yT = randomNumber(0, 500)
		}
	}

	function createBoundPoints(points: number, origin: [number, number], radius: number) {
		const step = 360 / points // División equitativa de los ángulos
		const bound: [number, number][] = []

		for (let i = 0; i < points; i++) {
			const angle = step * i // Ángulo en grados
			const radians = angle * (Math.PI / 180) // Convertimos a radianes

			// Calculamos la posición de cada punto usando trigonometría
			const x = origin[0] + radius * Math.cos(radians)
			const y = origin[1] + radius * Math.sin(radians)

			bound.push([x, y])
		}

		return bound
	}
	function isInsidePoly(source: [number, number][], target: [number, number][]) {
		for (let i = 0; i < source.length; i++) {
			const vertice = source[i]
			if (isInside(vertice, target)) return true
		}
		return false
	}

	// Manejar cuando se presiona una tecla
	const handleKeyDown = (e: KeyboardEvent) => {
		keysPressed[e.key] = true
	}

	const handleKeyUp = (e: KeyboardEvent) => {
		keysPressed[e.key] = false
	}

	onMount(() => {
		return runOnFrames(60, update)
	})
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="enviroment s-6" bind:clientWidth={w} style:height="{h}px">
	<Target x={xT} y={yT}></Target>
	<Creature {x} {y} direction={dir}></Creature>
	<!-- <Bouning vertices={spiderBound}></Bouning>
		<Bouning vertices={targetBound}></Bouning> -->
</div>

<style>
	.enviroment {
		position: relative;
		width: 100%;
	}
	:global(.debug > *) {
		outline: 1px solid var(--brand);
	}
</style>
