import { random, randomElement, randomIndex } from '$lib/utils'
import { NODE_POOL, EDGE_POOL } from './cells'

export interface Cell {
	value: number
	evaluate(x: number): void
	mutate(): void
}

type Node = {
	id: number
	key: string // key in NODE_POOL
	layer: number
	cell: Cell
}

type Edge = {
	key: string // key in EDGE_POOL
	source: number
	target: number
	cell: Cell
}

const NODES = Object.keys(NODE_POOL) as Array<keyof typeof NODE_POOL>
const EDGES = Object.keys(EDGE_POOL) as Array<keyof typeof EDGE_POOL>

// DirectedAcyclicGraph
export class Brain {
	fitness = 0
	edges: Edge[] = []
	nodes: Node[] = []
	graph: Map<Node, Set<Node>> = new Map()
	sorted: Set<Node>[] = []

	constructor(inputs?: number, outputs?: number) {
		if (!inputs || !outputs) return
		for (let i = 0; i < inputs; i++) {
			this.addNode(0)
		}
		for (let i = 0; i < outputs; i++) {
			this.addNode(1)
		}
		let edges = inputs * outputs
		while (edges-- > 0) {
			this.edge()
		}
	}

	addNode(layer: number) {
		const nodeKey = randomElement(NODES)
		const node: Node = {
			id: this.nodes.length,
			key: nodeKey,
			layer: layer,
			cell: new NODE_POOL[nodeKey]()
		}
		this.graph.set(node, new Set())
		this.nodes.push(node)
	}

	node() {
		if (this.edges.length === 0) return
		const edge1 = randomElement(this.edges)

		const prevNode = this.nodes[edge1.source]
		const nextNode = this.nodes[edge1.target]

		const nodeKey = randomElement(NODES)
		const node: Node = {
			id: this.nodes.length,
			key: nodeKey,
			layer: (prevNode.layer + nextNode.layer) / 2,
			cell: new NODE_POOL[nodeKey]()
		}
		this.graph.get(prevNode)!.add(node)
		this.graph.get(prevNode)!.delete(nextNode)
		this.graph.set(node, new Set([nextNode]))

		const nodeindex = this.nodes.push(node) - 1

		const edgeKey = randomElement(EDGES)
		const edge2: Edge = {
			key: edgeKey,
			source: nodeindex,
			target: edge1.target,
			cell: new EDGE_POOL[edgeKey]()
		}

		edge1.target = nodeindex
		this.edges.push(edge2)
		this.sort()
	}

	edge() {
		if (this.nodes.length < 2) return
		// nodos candidatos para connectar
		const candidates: [number, number][] = []

		// conexiones existentes
		const existing = new Set<number>()
		const nodes = this.nodes.length

		for (let i = 0; i < this.edges.length; i++) {
			const edge = this.edges[i]
			existing.add(edge.source * nodes + edge.target)
		}

		for (let i = 0; i < nodes; i++) {
			const source = this.nodes[i]
			for (let j = 0; j < nodes; j++) {
				const target = this.nodes[j]
				if (source.layer >= target.layer) continue
				if (i === j) continue

				const key = i * nodes + j
				if (existing.has(key)) continue

				candidates.push([i, j])
			}
		}

		if (candidates.length === 0) return

		const [source, target] = randomElement(candidates)
		const edgeKey = randomElement(EDGES)
		const edge: Edge = {
			key: edgeKey,
			source,
			target,
			cell: new EDGE_POOL[edgeKey]()
		}
		const sNode = this.nodes[source]
		const tNode = this.nodes[target]
		this.graph.get(sNode)!.add(tNode)
		this.edges.push(edge)
		this.sort()
	}

	sort() {
		this.sorted = toposort(this.graph)
	}

	propagate(inputs: number[]) {
		// asignar inputs a la primera capa
		[...this.sorted[0]].forEach((node, i) => {
			node.cell.value = inputs[i]
		})

		// propagar por capas
		for (let l = 1; l < this.sorted.length; l++) {
			const layer = this.sorted[l]

			for (const node of layer) {
				let sum = 0

				for (const edge of this.edges) {
					if (edge.target !== node.id) continue

					const source = this.nodes[edge.source]
					const x = source.cell.value

					edge.cell.evaluate(x)
					sum += edge.cell.value
				}

				node.cell.evaluate(sum)
			}
		}

		// devolver outputs (última capa)
		const lastLayer = this.sorted[this.sorted.length - 1]
		return [...lastLayer].map((n) => n.cell.value)
	}

	mutate() {
		const prob = Math.random()
		if (prob < 0.01) this.edge()
		if (prob < 0.005) this.node()

		this.edges.forEach(edge => {
			if (prob < 0.0003) this.changeKeyEdge(edge)
			if (prob < 0.6) edge.cell.mutate()
		})
		this.nodes.forEach(node => {
			if (prob < 0.0003) this.changeKetNode(node)
			if (prob < 0.6) node.cell.mutate()
		})
	}

	changeKeyEdge(p: Edge | Node) {
		const edgeKey = randomElement(EDGES)
		p.key = edgeKey
		p.cell = new EDGE_POOL[edgeKey]()
	}
	changeKetNode(p: Edge | Node) {
		const edgeKey = randomElement(NODES)
		p.key = edgeKey
		p.cell = new NODE_POOL[edgeKey]()
	}

	toJSON() {
		return {
			nodes: this.nodes.map((n) => ({
				id: n.id,
				key: n.key,
				layer: n.layer,
				cell: { ...n.cell }
			})),
			edges: this.edges.map((e) => ({
				key: e.key,
				source: e.source,
				target: e.target,
				cell: { ...e.cell }
			}))
		}
	}

	static fromJSON(json: any) {
		const brain = new Brain()

		// reconstruir nodes
		for (const n of json.nodes) {
			const cell = new NODE_POOL[n.key]()
			Object.assign(cell, n.cell)

			const node: Node = {
				id: n.id,
				key: n.key,
				layer: n.layer,
				cell
			}

			brain.nodes.push(node)
			brain.graph.set(node, new Set())
		}

		// reconstruir edges
		for (const e of json.edges) {
			const cell = new EDGE_POOL[e.key]()
			Object.assign(cell, e.cell)

			const edge: Edge = {
				key: e.key,
				source: e.source,
				target: e.target,
				cell
			}

			brain.edges.push(edge)

			const source = brain.nodes[e.source]
			const target = brain.nodes[e.target]
			brain.graph.get(source)!.add(target)
		}

		brain.sort()

		return brain
	}

	clone() {
		const json = this.toJSON()
		return Brain.fromJSON(json)
	}
}

type DirectedAcyclicGraph = Map<string, Iterable<string>>

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
