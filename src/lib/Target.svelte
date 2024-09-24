<script lang="ts">
	export let x = 0
	export let y = 0
</script>

<div style:translate="{x - 25}px {y - 25}px"></div>

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
