<script lang="ts">
	import { linearScale } from '@chasi/ui/utils'
	import { getContext, setContext } from 'svelte'
	import { writable, type Writable } from 'svelte/store'

	type Domain = [number, number]

	export let x: number | string = 15
	export let y: number | string = 15

	const baseX = getContext<Writable<Domain>>('baseX')
	const baseY = getContext<Writable<Domain>>('baseY')

	export let domainX: Domain = $baseX
	export let domainY: Domain = $baseY
	export let rangeX: Domain = domainX
	export let rangeY: Domain = domainY

	$: xPos = linearScale(+x, domainX[0], domainX[1], $baseX[0], $baseX[1])
	$: yPos = linearScale(+y, domainY[0], domainY[1], $baseY[0], $baseY[1])

	setContext('baseX', writable(rangeX))
	setContext('baseY', writable(rangeY))
</script>

<g transform="translate({xPos}, {yPos})">
	<slot></slot>
</g>
