<script lang="ts" context="module">
	const domain = [0, 1] as [number, number]
</script>

<script lang="ts">
	import type { BSpline } from '$lib/KAN/BSpline'
	import { linspace } from '$lib/utils'
	import { CPath, CRect } from '@chasi/ui/graph'

	export let spline: BSpline
	export let width = 50
	export let height = 50
	export let x = 0
	export let y = 0

	$: px = linspace([0, 1], 100)
	$: py = px.map((v) => spline.evaluate(v))
</script>

<g transform="translate({x}, {y})">
	<!-- <CPath domainX={domain} domainY={domain} x={px} y={py} color="var(--brand)"></CPath> -->
	<CRect {width} {height} strokeColor="var(--s-1)" strokeWidth="1"></CRect>
</g>
