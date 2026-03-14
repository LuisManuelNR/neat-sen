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
	layer: number
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
	incomings = new Map<number, Set<Edge>>()
	outgoings = new Map<number, Set<Edge>>()
	layers: Node[][] = []

	constructor(inputSize?: number, outputSize?: number) {
		if (!inputSize || !outputSize) return
		const inputs = []
		for (let i = 0; i < inputSize; i++) {
			const inode = this.addNode(0)
			inputs.push(inode)
		}
		for (let i = 0; i < outputSize; i++) {
			const onode = this.addNode(1)
			inputs.forEach((inode) => {
				this.connect(inode.id, onode.id)
			})
		}
		this.sort()
	}

	addNode(layer: number, id?: number) {
		const node: Node = {
			id: id ?? this.nodes.length,
			layer,
			cell: new Sum()
		}
		this.nodes[node.id] = node
		this.incomings.set(node.id, new Set())
		this.outgoings.set(node.id, new Set())
		return node
	}

	connect(source: number, target: number, cell: CellEdge = new BSpline()) {
		const edge: Edge = {
			source,
			target,
			cell
		}
		this.edges.push(edge)
		this.incomings.get(target)!.add(edge)
		this.outgoings.get(source)!.add(edge)
		return edge
	}

	disconnect(edgeindex: number) {
		const edge = this.edges[edgeindex]
		this.incomings.get(edge.target)!.delete(edge)
		this.outgoings.get(edge.source)!.delete(edge)
		this.edges.splice(edgeindex, 1)
	}

	addRandomNode() {
		const selectedIndex = randomIndex(this.edges)
		const selected = this.edges[selectedIndex]
		const { source, target } = selected
		const [cell1, cell2] = selected.cell.split()

		const prevNode = this.nodes[source]
		const nextNode = this.nodes[target]
		const newnode = this.addNode((prevNode.layer + nextNode.layer) / 2)

		this.connect(source, newnode.id, cell1)
		this.connect(newnode.id, target, cell2)

		this.disconnect(selectedIndex)
		this.sort()
	}

	addRandomConnection() {
		const candidates: number[][] = []

		for (const a of this.nodes) {
			if (!a) continue

			for (const b of this.nodes) {
				if (!b) continue
				if (a.layer >= b.layer) continue

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
		this.sort()
	}

	sort() {
		const sorted = this.nodes.toSorted((a, b) => {
			return a.layer - b.layer
		})

		let lastLayer = -1
		let currentLayer = -1
		const layers: Node[][] = []
		sorted.forEach((n, i) => {
			if (lastLayer !== n.layer) {
				layers.push([])
				lastLayer = n.layer
				currentLayer++
			}
			n.layer = currentLayer
			layers[layers.length - 1].push(n)
		})

		this.layers = layers
	}

	evaluate(inputs: number[]) {
		const firstLayer = this.layers[0]

		if (inputs.length !== firstLayer.length) {
			throw new Error('Mismatch inputs size')
		}

		firstLayer.forEach((node, i) => {
			node.cell.value = inputs[i]
		})

		const outputs: number[] = []

		for (let l = 0; l < this.layers.length; l++) {
			const layer = this.layers[l]

			for (const node of layer) {
				if (l !== 0) {
					const incoming = this.incomings.get(node.id)!
					const xs = new Array(incoming.size)

					let i = 0
					for (const e of incoming) {
						xs[i++] = e.cell.value
					}

					node.cell.evaluate(xs)
				}

				const outEdges = this.outgoings.get(node.id)!

				if (outEdges.size === 0) {
					outputs.push(node.cell.value)
				} else {
					for (const edge of outEdges) {
						edge.cell.evaluate(node.cell.value)
					}
				}
			}
		}
		return outputs
	}

	mutate() {
		if (Math.random() < 0.1) return this.addRandomConnection()
		if (Math.random() < 0.02) return this.addRandomNode()
		if (Math.random() < 0.25) {
			const redge = randomElement(this.edges)
			redge.cell.mutate()
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
			}))
		}
	}

	static fromJSON(json: ReturnType<Brain['toJSON']>) {
		const brain = new Brain()

		json.nodes.forEach((rawNode) => {
			const source = brain.addNode(rawNode.layer, rawNode.id)
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
