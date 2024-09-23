<script lang="ts">
	import { runOnFrames } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import Creature from './Creature.svelte'

	export let w = 800
	export let h = 600

	let x = 0
	let y = 0
	let dir = 0
	const speed = 5
	const turnRate = 10
	const keysPressed: Record<string, boolean> = {}

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
	<Creature {x} {y} direction={dir}></Creature>
</div>

<style>
	.enviroment {
		position: relative;
		width: 100%;
	}
</style>
