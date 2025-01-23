import { randomString } from '@chasi/ui/utils'

type DagStore = {
	nodes: {
		[key: string]: (incomingConnections: any[]) => any
	}
	connections: {
		[key: string]: (output: any) => any
	}
}

export class DAG<T extends DagStore, N extends T['nodes'], C extends T['connections']> {
	nodes: Map<string, keyof N> = new Map()
	connections: Map<string, keyof C> = new Map()
	#tconnections: Map<string, Set<string>> = new Map()
	sorted: Set<string>[] = []
	store: DagStore

	constructor(store: T) {
		this.store = store
	}

	addNode(type: keyof N) {
		const id = randomString()
		this.nodes.set(id, type)
		this.#tconnections.set(id, new Set())
		return id
	}

	connect(type: keyof C, from: string, to: string) {
		this.connections.set(`${from}_${to}`, type)
		this.#tconnections.get(from)!.add(to)
		this.sort()
	}

	async process(inputs: any[]) {
		console.log(this.sorted)
		console.log(this.connections)
		let outputs: Record<string, any[]> = {}

		this.sorted[0].values().forEach((id, i) => {
			outputs[id] = [inputs[i]]
		})

		let responses: Map<string, { type: string; value: any }> = new Map()

		for (const batch of this.sorted) {
			const promises: Promise<void>[] = []
			batch.forEach((id) => {
				const conn = this.#tconnections.get(id)!
				const nodetype = this.nodes.get(id)!
				const fn = this.store.nodes[nodetype]
				promises.push(
					new Promise(async (resolve) => {
						let r = await fn(outputs[id])
						for (const dep of conn) {
							if (!outputs[dep]) outputs[dep] = []
							if (this.connections.has(`${id}_${dep}`)) {
								const connectionType = this.connections.get(`${id}_${dep}`)!
								const fc = this.store.connections[connectionType]
								r = await fc(r)
							}
							outputs[dep].push(r)
						}
						responses.set(id, { type: nodetype, value: r })
						resolve()
					})
				)
			})
			await Promise.all(promises)
		}
		return responses
	}

	sort() {
		this.sorted = toposort(this.#tconnections)
		return this.sorted
	}

	garph() {}
}

export type DirectedAcyclicGraph = Map<string, Iterable<string>>

function toposort(dag: DirectedAcyclicGraph) {
	const inDegrees = countInDegrees(dag)

	let { roots, nonRoots } = getRootsAndNonRoots(inDegrees)

	const sorted: Array<Set<string>> = []

	while (roots.size) {
		sorted.push(roots)

		const newRoots = new Set<string>()
		for (const root of roots) {
			for (const dependent of dag.get(root)!) {
				inDegrees.set(dependent, inDegrees.get(dependent)! - 1)
				if (inDegrees.get(dependent) === 0) {
					newRoots.add(dependent)
				}
			}
		}

		roots = newRoots
	}
	nonRoots = getRootsAndNonRoots(inDegrees).nonRoots

	if (nonRoots.size) {
		throw Error('Cycle(s) detected; toposort only works on acyclic graphs')
	}

	return sorted
}

type InDegrees = Map<string, number>

function countInDegrees(dag: DirectedAcyclicGraph): InDegrees {
	const counts: InDegrees = new Map()

	for (const [vx, dependents] of dag.entries()) {
		counts.set(vx, counts.get(vx) ?? 0)
		for (const dependent of dependents) {
			counts.set(dependent, (counts.get(dependent) ?? 0) + 1)
		}
	}

	return counts
}

function getRootsAndNonRoots(counts: InDegrees) {
	const roots = new Set<string>()
	const nonRoots = new Set<string>()
	for (const [id, deg] of counts.entries()) {
		if (deg === 0) {
			roots.add(id)
		} else if (deg !== 0) {
			nonRoots.add(id)
		}
	}
	return { roots, nonRoots }
}
