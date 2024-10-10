<script lang="ts">
	import { DAG, DAGUnit } from '$lib/DAG'
	import Dag from '$lib/Dag.svelte'
	import { randomNumber } from '@chasi/ui/utils'
	import { onMount } from 'svelte'

	const dag = new DAG()

	const inputs = Array.from({ length: 4 }, () => new DAGUnit())
	const hidden = Array.from({ length: 6 }, () => new DAGUnit())
	const outputs = Array.from({ length: 3 }, () => new DAGUnit())

	dag.add([...inputs, ...hidden, ...outputs])

	inputs.forEach((unit) => {
		const other = hidden[randomIndex(hidden.length)]
		dag.connect(unit, other)
	})

	hidden.forEach((unit) => {
		const other = outputs[randomIndex(outputs.length)]
		dag.connect(unit, other)
	})

	onMount(() => {
		dag.process()
	})

	function randomIndex(length: number) {
		return Math.round(randomNumber(0, length - 1))
	}
</script>

<Dag {dag}></Dag>
