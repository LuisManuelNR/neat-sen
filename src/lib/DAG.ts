
type Evaluate = (...args: any) => any
export class DAG {
	nodes: Map<number, DAGUnit> = new Map()
	connections: Map<number, Set<number>> = new Map()
	#sorted: Set<number>[] = []
	#id = -1

	add(evaluate: Evaluate) {
		this.#id++
		this.nodes.set(this.#id, new DAGUnit(evaluate))
		this.connections.set(this.#id, new Set())
		this.#sorted = []
		return this.#id
	}

	connect(from: number, to: number) {
		const fromUnit = this.nodes.get(from)
		if (!fromUnit) throw new Error(`Unit ${from} must be added before connect`)
		const toUnit = this.nodes.get(to)
		if (!toUnit) throw new Error(`Unit ${to} must be added before connect`)

		this.connections.get(from)!.add(to)
		fromUnit.connect(toUnit)
		this.#sorted = []
	}

	disconnect(from: number, to: number) {
		const fromUnit = this.nodes.get(from)
		if (!fromUnit) throw new Error(`Unit ${from} must be added before connect`)
		const toUnit = this.nodes.get(to)
		if (!toUnit) throw new Error(`Unit ${to} must be added before connect`)

		this.connections.get(from)!.delete(to)
		fromUnit.disconnect(toUnit)
		this.#sorted = []
	}

	async process(inputs: any[]) {
		this.sort()

		let batchResult = inputs

		this.#sorted[0].forEach(id => {
			const node = this.nodes.get(id)!
			node.value.push(batchResult[id])
		})

		for (const batch of this.#sorted) {
			const promises: Promise<void>[] = []

			batch.forEach(id => {
				const node = this.nodes.get(id)!
				promises.push(node.process())
			})

			batchResult = await Promise.all(promises)
		}

		return batchResult
	}

	sort() {
		if (this.#sorted.length) return
		//@ts-ignore
		this.#sorted = toposort(this.connections)
		console.log('sorted', this.#sorted)
		return this.#sorted
	}

	garph() {
		this.sort()
		const units: Array<{ from: number; to: number[] }[]> = []
		this.#sorted.forEach((batch) => {
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
	evaluate: Evaluate
	value: any[]

	constructor(evaluate: Evaluate) {
		this.evaluate = evaluate
		this.value = []
	}

	connect(to: DAGUnit) {
		this.#dependeants.add(to)
	}

	disconnect(to: DAGUnit) {
		this.#dependeants.delete(to)
	}

	async process() {
		const result = await this.evaluate(this.value)

		this.#dependeants.forEach(unit => {
			unit.value.push(result)
		})

		this.value = []

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
