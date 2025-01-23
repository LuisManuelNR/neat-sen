<script lang="ts">
	import { DAG } from '$lib/DAG2'

	const dag = new DAG({
		nodes: {
			input: (xs: number[]) => xs[0],
			hidden: (xs: number[]) => xs.reduce((p, c) => p + c, 0),
			output: (xs: number[]) => xs.reduce((p, c) => p + c, 0)
		},
		connections: {
			cuadratic: (x: number) => Math.pow(x, 2),
			identity: (x: number) => x
		}
	})

	const i1 = dag.addNode('input')
	const i2 = dag.addNode('input')

	const h1 = dag.addNode('hidden')
	const h2 = dag.addNode('hidden')
	const h3 = dag.addNode('hidden')

	const o = dag.addNode('output')

	dag.connect('cuadratic', i1, h1)
	dag.connect('identity', i1, h2)
	dag.connect('identity', i1, h3)

	dag.connect('identity', i2, h1)
	dag.connect('identity', i2, h2)
	dag.connect('identity', i2, h3)

	dag.connect('identity', h1, o)
	dag.connect('identity', h2, o)
	dag.connect('identity', h3, o)

	let result = []

	async function processDag() {
		const pr = await dag.process([2, 2])
		console.log(pr)
		for (const [id, { type, value }] of pr) {
			if (type === 'output') {
				result.push(value)
			}
		}
		result = result
	}
</script>

<button class="btn" on:click={processDag}>process dag</button>
<pre>{JSON.stringify(result)}</pre>
