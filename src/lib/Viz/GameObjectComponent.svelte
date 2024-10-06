<script lang="ts">
	import type { GameObject } from './GameObject'

	export let go: GameObject
	export let width = 50
	export let height = 50
</script>

<div
	class="d-grid"
	style:width="{width}px"
	style:height="{height}px"
	style:translate="{go.x - width / 2}px {go.y - height / 2}px"
	style:rotate="{go.angle}rad"
>
	<slot></slot>
</div>

<style>
	div {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
