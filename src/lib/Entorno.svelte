<script lang="ts">
	import Creature from './Creature.svelte'

	export let w = '800px'
	export let h = '600px'
	export let population = 2
</script>

<div class="enviroment s-6" style:--w={w} style:--h={h}>
	{#each Array.from({ length: population }) as _}
		<Creature></Creature>
	{/each}
</div>

<style>
	.enviroment {
		width: var(--w);
		height: var(--h);
	}
</style>
