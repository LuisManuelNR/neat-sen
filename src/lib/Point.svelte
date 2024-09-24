<script lang="ts">
	export let x = 0
	export let y = 0
</script>

<div style:translate="{x - 1}px {y - 1}px"></div>

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
