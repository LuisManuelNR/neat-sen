import { randomElement, randomIndex } from '$lib/utils'
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

type Node = {
	id: number
	cell: CellNode
}

type Edge = {
	source: number
	target: number
	cell: CellEdge
}

export class Brain {
	fitness = 0

	nodes: Node[] = []
	edges: Edge[] = []

	incomings = new Map<number, Set<Edge>>()
	outgoings = new Map<number, Set<Edge>>()

	inputIds = new Set<number>()
	outputIds = new Set<number>()

	constructor(inputSize?: number, outputSize?: number) {
		if (!inputSize || !outputSize) return

		for (let i = 0; i < inputSize; i++) {
			const n = this.addNode()
			this.inputIds.add(n.id)
		}

		for (let i = 0; i < outputSize; i++) {
			const n = this.addNode()
			this.outputIds.add(n.id)

			for (const input of this.inputIds) {
				this.connect(input, n.id)
			}
		}
	}

	addNode(id?: number) {
		const node: Node = {
			id: id ?? this.nodes.length,
			cell: new Sum()
		}

		this.nodes[node.id] = node
		this.incomings.set(node.id, new Set())
		this.outgoings.set(node.id, new Set())

		return node
	}

	connect(source: number, target: number, cell: CellEdge = new BSpline()) {
		const edge: Edge = { source, target, cell }

		this.edges.push(edge)
		this.incomings.get(target)!.add(edge)
		this.outgoings.get(source)!.add(edge)

		return edge
	}

	disconnect(index: number) {
		const edge = this.edges[index]

		this.incomings.get(edge.target)!.delete(edge)
		this.outgoings.get(edge.source)!.delete(edge)

		this.edges.splice(index, 1)
	}

	addRandomNode() {
		const index = randomIndex(this.edges)
		const edge = this.edges[index]

		const [c1, c2] = edge.cell.split()

		const node = this.addNode(0)

		this.connect(edge.source, node.id, c1)
		this.connect(node.id, edge.target, c2)

		this.disconnect(index)
	}

	addRandomConnection() {
		const candidates: [number, number][] = []

		for (const a of this.nodes) {
			for (const b of this.nodes) {
				if (a.id === b.id) continue
				if (this.inputIds.has(a.id) && this.inputIds.has(b.id)) continue
				if (this.outputIds.has(a.id) && this.outputIds.has(b.id)) continue

				const edges = this.outgoings.get(a.id)!

				let exists = false

				for (const e of edges) {
					if (e.target === b.id) {
						exists = true
						break
					}
				}

				if (!exists) candidates.push([a.id, b.id])
			}
		}

		if (!candidates.length) return

		const [source, target] = randomElement(candidates)

		this.connect(source, target)
	}

	evaluate(inputs: number[], steps = 3) {
		if (inputs.length !== this.inputIds.size) {
			throw new Error(
				`Mismatch inputs size, inputs: ${inputs.length}, expect: ${this.inputIds.size}`
			)
		}
		let i = 0
		this.inputIds.forEach(nid => {
			this.nodes[nid].cell.value = inputs[i++]
		})

		for (let step = 0; step < steps; step++) {
			for (const edge of this.edges) {
				const source = this.nodes[edge.source]
				edge.cell.evaluate(source.cell.value)
			}

			for (const node of this.nodes) {
				if (this.inputIds.has(node.id)) continue

				const incoming = this.incomings.get(node.id)!
				const xs = new Array(incoming.size)

				let i = 0
				for (const e of incoming) {
					xs[i++] = e.cell.value
				}

				node.cell.evaluate(xs)
			}
		}

		const outputs: number[] = []

		for (const id of this.outputIds) {
			outputs.push(this.nodes[id].cell.value)
		}

		return outputs
	}

	mutate() {
		if (Math.random() < 0.1) return this.addRandomConnection()
		if (Math.random() < 0.02) return this.addRandomNode()

		if (Math.random() < 0.25) {
			const edge = randomElement(this.edges)
			edge.cell.mutate()
		}
	}

	toJSON() {
		return {
			nodes: this.nodes.map((n) => ({
				...n,
				cell: { ...n.cell }
			})),
			edges: this.edges.map((e) => ({
				...e,
				cell: { ...e.cell }
			})),
			inputIds: [...this.inputIds],
			outputIds: [...this.outputIds]
		}
	}

	static fromJSON(json: ReturnType<Brain['toJSON']>) {
		const brain = new Brain()

		json.nodes.forEach((raw) => {
			const node = brain.addNode(raw.id)
			Object.assign(node.cell, raw.cell)
		})

		json.edges.forEach((raw) => {
			const edge = brain.connect(raw.source, raw.target)
			Object.assign(edge.cell, raw.cell)
		})

		brain.inputIds = new Set(json.inputIds)
		brain.outputIds = new Set(json.outputIds)

		return brain
	}

	clone() {
		return Brain.fromJSON(this.toJSON())
	}
}
