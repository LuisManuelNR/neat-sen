export class DAG {
	#nodes: Map<number, DAGUnit> = new Map()
	#deps: Map<number, Set<number>> = new Map()
	#sorted: Set<number>[] = []
	#id = -1

	add(unit: DAGUnit) {
		this.#id++
		this.#nodes.set(this.#id, unit)
		this.#deps.set(this.#id, new Set())
		this.#sorted = []
	}

	connect(from: number, to: number) {
		const fromUnit = this.#nodes.get(from)
		if (!fromUnit) throw new Error(`Unit ${fromUnit} must be added before connect`)
		const toUnit = this.#nodes.get(to)
		if (!toUnit) throw new Error(`Unit ${toUnit} must be added before connect`)

		if (fromUnit.conf.outputTest !== toUnit.conf.inputTest) {
			throw new Error(
				`Connection from Unit${from}:${fromUnit.conf.outputTest} => Unit${to}:${toUnit.conf.inputTest} is invalid`
			)
		}

		this.#deps.get(from)!.add(to)
		toUnit.inputs.add(fromUnit.process)
		this.#sorted = []
	}

	process() {
		this.#sort()
		let result: any[] = []
		this.#sorted.at(-1)?.forEach((id) => {
			const unit = this.#nodes.get(id)!
			result.push(unit.process())
		})
		return result
	}

	#sort() {
		if (this.#sorted.length) return
		//@ts-ignore
		this.#sorted = toposort(this.#deps)
	}

	garph() {
		this.#sort()
		return this.#sorted
	}
}

type DAGUnitFunction<I, O> = (input: I[]) => O
type DAGUnitConfig<I, O> = {
	inputTest: I
	outputTest: O
	evaluate: DAGUnitFunction<I, O>
}
export class DAGUnit<I = any, O = any> {
	conf: DAGUnitConfig<I, O>
	inputs: Set<DAGUnit['process']> = new Set()

	constructor(config: DAGUnitConfig<I, O>) {
		this.conf = config
		this.process = this.process.bind(this)
	}

	process() {
		const outputs: any[] = []
		for (const otherProcess of this.inputs) {
			outputs.push(otherProcess())
		}
		return this.conf.evaluate(outputs)
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
