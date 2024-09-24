<script lang="ts">
	import Point from './Point.svelte'

	export let vertices: [number, number][] = []
</script>

{#each vertices as point}
	<Point x={point[0]} y={point[1]}></Point>
{/each}
