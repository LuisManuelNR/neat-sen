<script lang="ts">
	import type { Vec2D } from '$lib/utils'
	import { pannable } from '@chasi/ui/actions'

	export let pos: Vec2D

	function setup(node: HTMLElement) {
		return pannable(node, {
			onMove(e, coords) {
				pos.x += coords.dx
				pos.y += coords.dy
			}
		})
	}
</script>

<div style:translate="{pos.x - 25}px {pos.y - 25}px" use:setup></div>

<style>
	div {
		position: absolute;
		left: 0;
		top: 0;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background-color: var(--accent);
	}
</style>
