<script lang="ts">
	import { createBoundPoints, Vec2D } from '$lib/utils'
	import GameObjectComponent from '$lib/Viz/GameObjectComponent.svelte'
	import { runOnFrames, randomNumber } from '@chasi/ui/utils'
	import { onMount } from 'svelte'
	import { GameObject } from '$lib/Viz/GameObject'
	import Spider from '../gym2/Spider.svelte'

	let spider = new GameObject()
	let target = new GameObject()
	target.x = 300
	target.y = 300
	const keysPressed: Record<string, boolean> = {}

	function update() {
		if (keysPressed['d']) {
			spider.angle += 0.5
		}
		if (keysPressed['a']) {
			spider.angle -= 0.5
		}
		if (keysPressed['w']) {
			spider.forward(6)
		}
		spider = spider
		target = target
	}

	// Manejar cuando se presiona una tecla
	const handleKeyDown = (e: KeyboardEvent) => {
		keysPressed[e.key] = true
	}

	const handleKeyUp = (e: KeyboardEvent) => {
		keysPressed[e.key] = false
	}

	onMount(() => {
		return runOnFrames(30, update)
	})
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="enviroment s-6">
	<Spider go={spider}></Spider>
	<GameObjectComponent go={target} width={50} height={50}>
		<div class="brand"></div>
	</GameObjectComponent>
</div>

<style>
	.enviroment {
		position: relative;
		width: 600px;
		height: 600px;
	}
</style>
