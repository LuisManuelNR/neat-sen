import { DAG } from '$lib/DAG'
import { linspace, randomElement } from '$lib/utils'
import { RBF } from './RBF'
import { BSpline } from './Spline'

function theta(inputs: number[]) {
	const w = 1 / inputs.length
	const sum = inputs.reduce((prev, current) => prev + current * w, 0)
	return sum
}
export class Brain {
	#inputSize: number
	#outputSize: number
	tfunction: Map<string, RBF> = new Map()
	lastResult: Map<string, number> = new Map()
	dag = new DAG({
		nodes: {
			input: (xs) => xs[0],
			hidden: theta,
			output: theta
		},
		connections: {
			identity: (x) => x,
			spline: (x, connid) => this.tfunction.get(connid)!.evaluate(x)
		}
	})

	constructor(inputSize: number, outputSize: number) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		const inputsIds = []
		for (let i = 0; i < inputSize; i++) {
			const id = this.dag.addNode('input')
			inputsIds.push(id)
		}

		for (let i = 0; i < outputSize; i++) {
			const oid = this.dag.addNode('output')
			inputsIds.forEach((id) => {
				this.#connect(id, oid)
			})
		}
	}

	#connect(from: string, to: string, tfunc?: RBF) {
		const connid = this.dag.connect('spline', from, to)
		if (!connid) return
		if (tfunc) {
			this.tfunction.set(connid, tfunc.clone())
		} else {
			this.tfunction.set(connid, new RBF([0, 1]))
		}
	}

	#disconnect(from: string, to: string) {
		const connid = this.dag.disconnect(from, to)
		if (!connid) return
		const spline = this.tfunction.get(connid)
		this.tfunction.delete(connid)
		return spline!
	}

	addEdge() {
		const sorted = this.dag.sorted
		const available: string[][] = []
		const prevBatch: string[] = []
		for (let i = 1; i < sorted.length; i++) {
			const batch = sorted[i]
			prevBatch.push(...sorted[i - 1])
			batch.forEach((to) => {
				prevBatch.forEach((from) => {
					if (!this.dag.connections.has(`${from}_${to}`)!) {
						available.push([from, to])
					}
				})
			})
		}
		if (available.length === 0) return
		const [from, to] = randomElement(available)
		this.#connect(from, to)
	}

	removeEdge() {
		if (this.dag.connections.size < this.dag.nodes.size) return
		const candidates: [string, string][] = []
		for (const [from, deps] of this.dag.graph) {
			if (deps.size > 1) {
				deps.forEach((to) => {
					for (const [from2, deps2] of this.dag.graph) {
						if (from2 !== from && deps2.has(to)) {
							candidates.push([from, to])
						}
					}
				})
			}
		}
		if (!candidates.length) return
		const [from, to] = randomElement(candidates)
		this.#disconnect(from, to)
	}

	addNode() {
		// 1. Filtrar las conexiones existentes
		const conexiones: Array<[string, string]> = []
		for (const [key] of this.dag.connections) {
			const [from, to] = key.split('_')
			conexiones.push([from, to])
		}

		if (conexiones.length === 0) return

		// 2. Seleccionar una conexión aleatoria
		const [from, to] = randomElement(conexiones)

		// 3. Desconectar la conexión seleccionada
		const spline = this.#disconnect(from, to)

		// 4. Crear un nuevo nodo
		const nuevoNodo = this.dag.addNode('hidden')

		// 5. Establecer nuevas conexiones
		this.#connect(from, nuevoNodo, spline)
		this.#connect(nuevoNodo, to)
	}

	removeNode() {
		if (this.dag.nodes.size === this.#inputSize + this.#outputSize) return
		const hiddens: string[] = []
		for (const [id, type] of this.dag.nodes) {
			if (type === 'hidden') hiddens.push(id)
		}
		const rNodeId = randomElement(hiddens)

		const incommingConnections = []
		for (const [from, deps] of this.dag.graph) {
			if (deps.has(rNodeId)) incommingConnections.push(from)
		}
		const outgoingConnections = [...this.dag.graph.get(rNodeId)!]

		incommingConnections.forEach((input) => {
			outgoingConnections.forEach((output) => {
				if (!this.dag.graph.get(input)!.has(output)) {
					this.#connect(input, output)
				}
			})
		})

		this.dag.removeNode(rNodeId)
		for (const [connid] of this.tfunction) {
			if (connid.includes(rNodeId)) this.tfunction.delete(connid)
		}
	}

	async forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		const pr = await this.dag.process(inputs)
		const r: number[] = []
		for (const [id, { type, value }] of pr) {
			if (type === 'output') {
				r.push(value)
			}
			this.lastResult.set(id, value)
		}
		return r
	}

	mutate() {
		// for (let i = 0; i < 10; i++) {
		// if (Math.random() < 0.9) {
		// 	this.tfunction.forEach((s) => s.mutate())
		// } else {
		const probabilty = Math.floor(Math.random() * 6)
		if (probabilty === 0) this.addNode()
		if (probabilty === 1) this.addEdge()
		if (probabilty === 2) this.removeNode()
		if (probabilty === 3) this.removeEdge()
		if (probabilty === 4) this.tfunction.forEach((s) => s.mutate())
		// }
		// }
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.dag = this.dag.clone(clone.dag.store)
		clone.tfunction.clear()
		for (const [id, spline] of this.tfunction) {
			clone.tfunction.set(id, spline.clone())
		}
		return clone
	}

	draw(width: number, height: number) {
		const g = this.dag.draw(width, height)
		const tfunction = g.connectionPositions.map((c) => ({
			fn: this.tfunction.get(`${c[4]}_${c[5]}`)!,
			x: (c[0] + c[1]) / 2,
			y: (c[2] + c[3]) / 2
		}))
		return {
			...g,
			tfunction
		}
	}
}
