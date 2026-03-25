import { randomElement } from '$lib/utils'
import { BSpline, Sum } from './cells/Cells'

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

export type Node = {
	id: number
	incoming: Set<Edge>
	outgoing: Set<Edge>
	cell: CellNode
}

export type Edge = {
	fromid: number
	toid: number
	cell: CellEdge
}

export class Brain {
	fitness = 0

	nodes: Node[] = []
	sorted: Node[] = []
	disconnectedPairs = new Set<string>() // from-to

	constructor(inputSize?: number, outputSize?: number) {
		if (!inputSize || !outputSize) return
		// conectamos todas las entradas entre todas las salidas
		const inputs = []
		for (let i = 0; i < inputSize; i++) {
			const nid = this.addNode()
			inputs.push(nid)
		}

		for (let i = 0; i < outputSize; i++) {
			const toid = this.addNode()
			for (const fromid of inputs) {
				this.connect(fromid, toid)
			}
		}
		this.sorted = this.nodes.slice()
	}

	addNode(id?: number) {
		const node: Node = {
			id: id ?? this.nodes.length,
			incoming: new Set(),
			outgoing: new Set(),
			cell: new Sum()
		}
		this.nodes[node.id] = node
		return node.id
	}

	connect(fromid: number, toid: number, cell: CellEdge = new BSpline()) {
		const edge: Edge = { fromid, toid, cell }

		const from = this.nodes[fromid]
		const to = this.nodes[toid]

		from.outgoing.add(edge)
		to.incoming.add(edge)

		this.disconnectedPairs.delete(`${fromid}-${toid}`)

		return edge
	}

	disconnect(edge: Edge) {
		const { fromid, toid } = edge

		const from = this.nodes[fromid]
		const to = this.nodes[toid]

		from.outgoing.delete(edge)
		to.incoming.delete(edge)

		this.disconnectedPairs.add(`${fromid}-${toid}`)
	}

	sort() {
		const inDegree = new Map<Node, number>()
		const queue: Node[] = []
		const result: Node[] = []

		for (const node of this.nodes) {
			const deg = node.incoming.size
			inDegree.set(node, deg)

			if (deg === 0) {
				queue.push(node)
			}
		}

		while (queue.length > 0) {
			const node = queue.shift()!
			result.push(node)

			for (const edge of node.outgoing) {
				const to = this.nodes[edge.toid]
				const next = to
				const deg = inDegree.get(next)! - 1
				inDegree.set(next, deg)

				if (deg === 0) {
					queue.push(next)
				}
			}
		}

		if (result.length !== this.nodes.length) {
			throw new Error('Graph has cycles (expected DAG)')
		}

		this.sorted = result
	}

	addRandomNode() {
		const node = randomElement(this.nodes)
		const edges = node.incoming.size > node.outgoing.size ? node.incoming : node.outgoing
		if (!edges.size) return
		const edge = randomElement([...edges])
		const newNode = this.addNode()

		const [c1, c2] = edge.cell.split()

		this.connect(edge.fromid, newNode, c1)
		this.connect(newNode, edge.toid, c2)
		this.disconnect(edge)
		this.sort()
	}

	addRandomConnection() {
		if (!this.disconnectedPairs.size) return
		const connid = randomElement([...this.disconnectedPairs])
		const [fromid, toid] = connid.split('-')
		this.connect(+fromid, +toid)
		this.sort()
	}

	evaluate(inputs: number[]) {
		if (!this.sorted.length) this.sort()
		const outputs: number[] = []

		for (let i = 0; i < this.sorted.length; i++) {
			const node = this.sorted[i]

			if (node.incoming.size) {
				const xs = Array.from(node.incoming, (e) => e.cell.value)
				node.cell.evaluate(xs)
			} else {
				node.cell.value = inputs[node.id]
			}

			if (node.outgoing.size) {
				for (const edge of node.outgoing) {
					edge.cell.evaluate(node.cell.value)
				}
			} else {
				outputs.push(node.cell.value)
			}
		}

		return outputs
	}

	mutate() {
		if (Math.random() < 0.005) this.addRandomNode()
		else if (Math.random() < 0.1) this.addRandomConnection()
		else if (Math.random() < 0.6) {
			const node = randomElement(this.sorted)
			const edges = node.outgoing.size ? node.outgoing : node.incoming
			const edge = randomElement([...edges])
			edge.cell.mutate()
		}
	}

	toJSON() {
		return {
			sorted: this.sorted.map((node) => ({
				id: node.id,
				outgoing: node.outgoing.values().map((e) => ({ ...e, cell: structuredClone(e.cell) }))
			})),
			disconnectedPairs: [...this.disconnectedPairs]
		}
	}

	static fromJSON(json: ReturnType<Brain['toJSON']>) {
		const brain = new Brain()
		brain.disconnectedPairs = new Set(json.disconnectedPairs)

		// // 1. crear nodos
		json.sorted.forEach((raw) => {
			brain.addNode(raw.id)
		})

		// // // 2. reconstruir edges (solo outgoing)
		json.sorted.forEach((raw) => {
			raw.outgoing.forEach((edge) => {
				const newEdge = brain.connect(edge.fromid, edge.toid)
				Object.assign(newEdge.cell, edge.cell)
			})
		})

		// // 3. recomputar orden
		brain.sort()
		return brain
	}

	clone() {
		return Brain.fromJSON(this.toJSON())
	}
}
