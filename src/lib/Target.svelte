<script lang="ts">
	import { pannable } from '@chasi/ui/actions'

	export let x = 0
	export let y = 0

	function setup(node: HTMLElement) {
		return pannable(node, {
			onMove(e, coords) {
				x += coords.dx
				y += coords.dy
			}
		})
	}
</script>

<div style:translate="{x - 25}px {y - 25}px" use:setup></div>

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
