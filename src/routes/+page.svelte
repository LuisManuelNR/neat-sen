<script lang="ts">
	import { DAG, DAGUnit } from '$lib/DAG'
	import Dag from '$lib/Dag.svelte'
	import { onMount } from 'svelte'

	const dag = new DAG()

	function createInput() {
		return new DAGUnit({
			inputTest: 0,
			outputTest: 0,
			evaluate() {
				return Math.random()
			}
		})
	}

	function createNeuron() {
		return new DAGUnit({
			inputTest: 0,
			outputTest: 0,
			evaluate(input) {
				return input.reduce((p, c) => p * c, 1)
			}
		})
	}

	const inputs = Array.from({ length: 4 }, createInput)
	const hidden = Array.from({ length: 6 }, createNeuron)
	const outputs = Array.from({ length: 3 }, createNeuron)

	const net = [...inputs, ...hidden, ...outputs]
	net.forEach((n) => dag.add(n))

	dag.connect(0, 4)
	dag.connect(1, 5)
	dag.connect(2, 6)
	dag.connect(3, 7)

	dag.connect(7, 10)
	dag.connect(7, 11)

	dag.connect(8, 12)
	// dag.connect(8, 13)

	dag.connect(9, 12)
	// dag.connect(9, 13)

	// hidden.forEach((unit) => {
	// 	const other = outputs[randomIndex(outputs.length)]
	// 	dag.connect(unit, other)
	// })

	onMount(() => {
		const output = dag.process()
		console.log('Salida final', output)
	})
</script>

<Dag {dag}></Dag>
