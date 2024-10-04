<script lang="ts">
	import type { Vec2D } from '$lib/utils'

	export let vertices: Vec2D[] = []
</script>

{#each vertices as point}
	<div style:translate="{point.x - 1}px {point.y - 1}px"></div>
{/each}

<style>
	div {
		position: absolute;
		left: 0;
		top: 0;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background-color: var(--accent);
		outline: 2px solid var(--brand);
	}
</style>
