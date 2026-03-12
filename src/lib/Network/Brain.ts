import { clamp, random, randomElement, randomIndex } from '$lib/utils'
import { BSpline, Clock, Sum } from './cells/Cells'

export interface CellNode {
	value: number
	evaluate(xs: number[]): void
}
export interface CellEdge {
	value: number
	evaluate(x: number): void
	mutate(): void
	split(): [CellEdge, CellEdge]
}

type Node = {
	id: number
	cell: CellNode
}
type Edge = {
	source: number
	target: number
	cell: CellEdge
}

// DirectedAcyclicGraph
export class Brain {
	fitness = 0
	edges: Edge[] = []
	nodes: Node[] = []
	dag = new Map<number, Set<number>>() // number is index in nodes
	sorted: Array<Set<number>> = [] // number is index in nodes
	incoming: Edge[][] = []

	constructor(inputSize?: number, outputSize?: number) {
		if (!inputSize || !outputSize) return
		const inputs = []
		for (let i = 0; i < inputSize; i++) {
			const inode = this.addNode()
			inputs.push(inode)
		}
		// const clock = this.addNode(true)
		for (let i = 0; i < outputSize; i++) {
			const onode = this.addNode()
			inputs.forEach((inode) => {
				this.connect(inode.id, onode.id)
			})
		}
		this.sort()
	}

	addNode(id?: number) {
		const node: Node = {
			id: id || this.nodes.length,
			cell: new Sum()
		}
		this.nodes[node.id] = node
		this.dag.set(node.id, new Set())
		return node
	}

	connect(source: number, target: number, cell: CellEdge = new BSpline()) {
		const edge: Edge = {
			source,
			target,
			cell
		}
		this.edges.push(edge)
		this.dag.get(source)!.add(target)
		return edge
	}

	disconnect(source: number, target: number, edgeindex: number) {
		this.dag.get(source)!.delete(target)
		this.edges.splice(edgeindex, 1)
	}

	addRandomNode() {
		const selectedIndex = randomIndex(this.edges)
		const selected = this.edges[selectedIndex]
		const { source, target } = selected
		const [cell1, cell2] = selected.cell.split()

		const newnode = this.addNode()

		this.connect(source, newnode.id, cell1)
		this.connect(newnode.id, target, cell2)

		this.disconnect(source, target, selectedIndex)
		this.sort()
	}

	addRandomConnection() {
		const candidates: number[][] = []

		const existing = new Set(this.edges.map((e) => `${e.source}-${e.target}`))

		for (let i = 0; i < this.sorted.length; i++) {
			for (let j = i + 1; j < this.sorted.length; j++) {
				const layerA = this.sorted[i]
				const layerB = this.sorted[j]

				for (const source of layerA) {
					for (const target of layerB) {
						if (!existing.has(`${source}-${target}`)) {
							candidates.push([source, target])
						}
					}
				}
			}
		}

		if (!candidates.length) return

		const [source, target] = randomElement(candidates)

		this.connect(source, target)
		this.sort()
	}

	sort() {
		this.sorted = toposort(this.dag)

		this.incoming = new Array(this.nodes.length)

		for (let i = 0; i < this.nodes.length; i++) {
			this.incoming[i] = []
		}

		for (const edge of this.edges) {
			this.incoming[edge.target].push(edge)
		}
	}

	evaluate(inputs: number[]) {
		const firstLayer = this.sorted[0]

		if (inputs.length !== firstLayer.size) {
			throw new Error('Mismatch inputs size')
		}

		let i = 0
		for (const nodeid of firstLayer) {
			this.nodes[nodeid].cell.value = inputs[i++]
		}

		for (let l = 1; l < this.sorted.length; l++) {
			const layer = this.sorted[l]

			for (const nodeid of layer) {
				const edges = this.incoming[nodeid]

				const xs: number[] = new Array(edges.length)

				for (let k = 0; k < edges.length; k++) {
					const edge = edges[k]
					const sourceVal = this.nodes[edge.source].cell.value

					edge.cell.evaluate(sourceVal)

					xs[k] = edge.cell.value
				}

				this.nodes[nodeid].cell.evaluate(xs)
			}
		}

		const lastLayer = this.sorted[this.sorted.length - 1]

		const outputs: number[] = new Array(lastLayer.size)

		i = 0
		for (const nodeid of lastLayer) {
			outputs[i++] = this.nodes[nodeid].cell.value
		}

		return outputs
	}

	mutate() {
		const prob = Math.random()
		if (prob < 0.06) this.addRandomConnection()
		if (prob < 0.003) this.addRandomNode()

		this.edges.forEach((edge) => {
			if (prob < 0.6) edge.cell.mutate()
		})
	}

	toJSON() {
		return {
			nodes: this.nodes.map((n) => ({
				id: n.id,
				cell: { ...n.cell }
			})),
			edges: this.edges.map((e) => ({
				source: e.source,
				target: e.target,
				cell: { ...e.cell }
			}))
		}
	}

	static fromJSON(json: ReturnType<Brain['toJSON']>) {
		const brain = new Brain()

		json.nodes.forEach((rawNode) => {
			const source = brain.addNode(rawNode.id)
			Object.assign(source.cell, rawNode.cell)
		})

		json.edges.forEach((rawEdge) => {
			const edge = brain.connect(rawEdge.source, rawEdge.target)
			Object.assign(edge.cell, rawEdge.cell)
		})

		brain.sort()

		return brain
	}

	clone() {
		const json = this.toJSON()
		return Brain.fromJSON(json)
	}
}

type DirectedAcyclicGraph<T> = Map<T, Iterable<T>>

function toposort<T>(dag: DirectedAcyclicGraph<T>) {
	const inDegrees = countInDegrees(dag)

	let { roots, nonRoots } = getRootsAndNonRoots(inDegrees)

	const sorted: Array<Set<T>> = []

	while (roots.size) {
		sorted.push(roots)

		const newRoots = new Set<T>()
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

type InDegrees<T> = Map<T, number>

function countInDegrees<T>(dag: DirectedAcyclicGraph<T>): InDegrees<T> {
	const counts: InDegrees<T> = new Map()

	for (const [vx, dependents] of dag.entries()) {
		counts.set(vx, counts.get(vx) ?? 0)
		for (const dependent of dependents) {
			counts.set(dependent, (counts.get(dependent) ?? 0) + 1)
		}
	}

	return counts
}

function getRootsAndNonRoots<T>(counts: InDegrees<T>) {
	const roots = new Set<T>()
	const nonRoots = new Set<T>()
	for (const [id, deg] of counts.entries()) {
		if (deg === 0) {
			roots.add(id)
		} else if (deg !== 0) {
			nonRoots.add(id)
		}
	}
	return { roots, nonRoots }
}
