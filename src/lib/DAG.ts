export class DAG {
	nodes: Set<DAGUnit> = new Set()
	#deps: Map<string, Set<string>> = new Map()
	sorted: Set<string>[] = []

	add(units: DAGUnit[]) {
		units.forEach((unit) => {
			if (this.#deps.has(unit.id)) return
			this.nodes.add(unit)
			this.#deps.set(unit.id, new Set())
		})
		this.#sort()
	}

	connect(from: DAGUnit, to: DAGUnit) {
		this.#deps.get(from.id)!.add(to.id)
		this.#sort()
	}

	process() {
		console.log(this.sorted)
	}

	#sort() {
		this.sorted = toposort(this.#deps)
	}
}

export class DAGUnit {
	id = crypto.randomUUID()
	data: any
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
