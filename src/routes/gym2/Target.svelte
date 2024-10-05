<script lang="ts">
	import { Vec2D } from '$lib/utils'
	import { pannable } from '@chasi/ui/actions'

	export let pos: Vec2D

	function setup(node: HTMLElement) {
		return pannable(node, {
			onMove(e, { dx, dy }) {
				pos = new Vec2D((pos.x += dx), (pos.y += dy))
			}
		})
	}
</script>

<div
	style:translate="{pos.x - 25}px {pos.y - 25}px"
	style:rotate="{pos.direccion + 90}deg"
	use:setup
>
	<span></span>
</div>

<style>
	div {
		display: flex;
		justify-content: center;
		position: absolute;
		left: 0;
		top: 0;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background-color: var(--accent);
	}
	span {
		display: block;
		background-color: var(--brand);
		width: 5px;
		height: 5px;
	}
</style>
