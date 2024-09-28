<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { getContext, setContext } from 'svelte'
	import Spline from './Spline.svelte'
	import { writable, type Writable } from 'svelte/store'

	export let splines: BSpline[] = []
	export let offset = 0

	$: height = getContext<Writable<number>>('rootHeight')
	const step = 70
</script>

<g transform="translate({offset}, {$height / 2 - splines.length * 25})">
	{#each splines as spline, i}
		<g transform="translate(0, {step * i})">
			<Spline {spline}></Spline>
		</g>
	{/each}
</g>
