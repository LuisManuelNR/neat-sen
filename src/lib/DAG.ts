import { max, randomString } from '@chasi/ui/utils'

type DagStore = {
	nodes: {
		[key: string]: (incomingConnections: any[], nodeid: string) => any
	}
	connections: {
		[key: string]: (output: any, connectionid: string) => any
	}
}
type Key<T extends DagStore, K extends keyof T> = keyof T[K] extends string ? keyof T[K] : never

type NodeTypes<T extends DagStore> = Key<T, 'nodes'>
type ConnectionTypes<T extends DagStore> = Key<T, 'connections'>

export class DAG<T extends DagStore> {
	nodes: Map<string, NodeTypes<T>> = new Map()
	connections: Map<string, ConnectionTypes<T>> = new Map()
	graph: Map<string, Set<string>> = new Map()
	sorted: Set<string>[] = []
	store: DagStore

	constructor(store: T) {
		this.store = store
	}

	addNode(type: NodeTypes<T>) {
		const id = randomString()
		this.nodes.set(id, type)
		this.graph.set(id, new Set())
		return id
	}

	removeNode(id: string) {
		this.nodes.delete(id)
		this.graph.delete(id)
		const connToDel = this.connections.keys().filter((k) => k.includes(id))
		connToDel.forEach((k) => {
			const [from, to] = k.split('_')
			if (to === id) {
				this.graph.get(from)!.delete(id)
			}
			this.connections.delete(k)
		})
		this.sort()
	}

	connect(type: ConnectionTypes<T>, from: string, to: string) {
		const id = `${from}_${to}`
		if (this.connections.has(id)) return
		this.connections.set(id, type)
		this.graph.get(from)!.add(to)
		this.sort()
	}

	disconnect(from: string, to: string) {
		const id = `${from}_${to}`
		if (!this.connections.has(id)) return
		this.connections.delete(id)
		const tconn = this.graph.get(from)!
		tconn.delete(to)
		this.sort()
	}

	async process(inputs: any[]) {
		let batchInput: Record<string, any[]> = {}

		this.sorted[0].values().forEach((id, i) => {
			batchInput[id] = [inputs[i]]
		})

		let outputs: Map<string, { type: string; value: any }> = new Map()

		for (const batch of this.sorted) {
			const promises: Promise<void>[] = []
			batch.forEach((id, i) => {
				promises.push(
					new Promise(async (resolve) => {
						const conn = this.graph.get(id)!
						const nodetype = this.nodes.get(id)!
						let r = await this.store.nodes[nodetype](batchInput[id], id)
						for (const dep of conn) {
							if (!batchInput[dep]) batchInput[dep] = []
							const connId = `${id}_${dep}`
							if (this.connections.has(connId)) {
								const connectionType = this.connections.get(connId)!
								r = await this.store.connections[connectionType](r, connId)
							}
							batchInput[dep].push(r)
						}
						outputs.set(id, { type: nodetype, value: r })
						resolve()
					})
				)
			})
			await Promise.all(promises)
		}
		return outputs
	}

	sort() {
		this.sorted = toposort(this.graph)
		return this.sorted
	}

	clone(store: DagStore) {
		const clone = new DAG(store)
		//@ts-ignore
		clone.nodes = structuredClone(this.nodes)
		//@ts-ignore
		clone.connections = structuredClone(this.connections)
		clone.graph = structuredClone(this.graph)
		clone.sort()
		return clone
	}

	draw(width = 800, height = 600) {
		const nodePositions: Map<string, { x: number; y: number; type: string }> = new Map()
		const connectionPositions: [number, number, number, number, string, string][] = []

		// Obtener el orden topológico de los nodos
		const layers = this.sorted

		const layerCount = layers.length
		const layerWidth = width / (layerCount + 1) // Anchura entre capas

		// Distribuir nodos por capa
		layers.forEach((layer, layerIndex) => {
			const nodeCount = layer.size
			const layerHeight = height / (nodeCount + 1) // Espacio entre nodos en la capa

			Array.from(layer).forEach((node, nodeIndex) => {
				const x = (layerIndex + 1) * layerWidth // Posición horizontal según la capa
				const y = (nodeIndex + 1) * layerHeight // Posición vertical
				const type = this.nodes.get(node)!
				nodePositions.set(node, { x, y, type })
			})
		})

		// Calcular posiciones de las conexiones
		for (const [from, connections] of this.graph) {
			connections.forEach((to) => {
				const fromPos = nodePositions.get(from)!
				const toPos = nodePositions.get(to)!
				connectionPositions.push([fromPos.x, toPos.x, fromPos.y, toPos.y, from, to])
			})
		}

		return { nodePositions, connectionPositions }
	}
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
