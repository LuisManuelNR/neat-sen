type Evaluate = (...args: any) => any
type ConnectionTransform = (...args: any) => any
export class DAG {
	nodes: Map<number, DAGUnit> = new Map()
	connections: Map<number, Set<number>> = new Map()
	sorted: Set<number>[] = []
	#id = -1

	add(evaluate: Evaluate) {
		this.#id++
		this.nodes.set(this.#id, new DAGUnit(evaluate))
		this.connections.set(this.#id, new Set())
		this.sort()
		return this.#id
	}

	remove(nodeId: number) {
		// Verifica si el nodo existe
		if (!this.nodes.has(nodeId)) {
			throw new Error(`Node ${nodeId} does not exist`)
		}

		// Elimina todas las conexiones entrantes al nodo
		for (const [from, connections] of this.connections) {
			if (connections.has(nodeId)) {
				connections.delete(nodeId)
				const fromUnit = this.nodes.get(from)
				const toUnit = this.nodes.get(nodeId)
				fromUnit?.disconnect(toUnit!)
			}
		}

		// Elimina todas las conexiones salientes desde el nodo
		this.connections.delete(nodeId)

		// Elimina el nodo de la lista de nodos
		this.nodes.delete(nodeId)

		// Reordena el DAG
		this.sort()
	}

	connect(from: number, to: number, fn?: ConnectionTransform) {
		if (from === to) return
		const fromUnit = this.nodes.get(from)
		if (!fromUnit) throw new Error(`Unit ${from} must be added before connect`)
		const toUnit = this.nodes.get(to)
		if (!toUnit) throw new Error(`Unit ${to} must be added before connect`)

		this.connections.get(from)!.add(to)
		fromUnit.connect(toUnit, fn)
		this.sort()
	}

	disconnect(from: number, to: number) {
		if (from === to) return
		const fromUnit = this.nodes.get(from)
		if (!fromUnit) throw new Error(`Unit ${from} must be added before connect`)
		const toUnit = this.nodes.get(to)
		if (!toUnit) throw new Error(`Unit ${to} must be added before connect`)

		this.connections.get(from)!.delete(to)
		fromUnit.disconnect(toUnit)
		this.sort()
	}

	async process(inputs: any[]) {
		const processid = crypto.randomUUID()
		let outputs = inputs

		for (const [id, node] of this.nodes) {
			node.value.set(processid, [])
		}

		this.sorted[0].forEach((id) => {
			const node = this.nodes.get(id)!
			node.value.set(processid, [outputs[id]])
		})

		for (const batch of this.sorted) {
			const promises: Promise<void>[] = []

			batch.forEach((id) => {
				const node = this.nodes.get(id)!
				promises.push(node.process(processid))
			})

			outputs = await Promise.all(promises)
		}

		for (const [id, node] of this.nodes) {
			node.value.delete(processid)
		}

		return outputs
	}

	sort() {
		//@ts-ignore
		this.sorted = toposort(this.connections)
		return this.sorted
	}

	garph() {
		const units: Array<{ from: number; to: number[] }[]> = []
		this.sorted.forEach((batch) => {
			const layer: { from: number; to: number[] }[] = []
			batch.forEach((unit) => {
				layer.push({ from: unit, to: Array.from(this.connections.get(unit)!) })
			})
			units.push(layer)
		})
		return units
	}
}
export class DAGUnit {
	#dependeants: Set<DAGUnit> = new Set()
	#connectionTranforms: Map<DAGUnit, ConnectionTransform> = new Map()
	evaluate: Evaluate
	value: Map<string, any[]> = new Map()

	constructor(evaluate: Evaluate) {
		this.evaluate = evaluate
	}

	connect(to: DAGUnit, fn?: ConnectionTransform) {
		this.#dependeants.add(to)
		if (fn) {
			this.#connectionTranforms.set(to, fn)
		}
	}

	disconnect(to: DAGUnit) {
		this.#dependeants.delete(to)
	}

	async process(id: string) {
		let result = await this.evaluate(this.value.get(id))

		this.#dependeants.forEach((unit) => {
			if (this.#connectionTranforms.has(unit)) {
				const tresult = this.#connectionTranforms.get(unit)!(result)
				unit.value.get(id)?.push(tresult)
			}
		})

		return result
	}
}

export type DirectedAcyclicGraph = Map<string, Iterable<string>>

export function toposort(dag: DirectedAcyclicGraph) {
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
