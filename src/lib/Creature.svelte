<script lang="ts">
	import spider from '../assets/spider.svg'

	export let x = 0
	export let y = 0
	export let direction = 0
</script>

<img src={spider} style:translate="{x - 50}px {y - 50}px" style:rotate="{direction}deg" alt="spider" />

<!-- <img src={spider} style:translate="{x}px {y}px" style:rotate="{direction}deg" alt="spider" /> -->

<style>
	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100px;
		height: 100px;
	}
</style>
