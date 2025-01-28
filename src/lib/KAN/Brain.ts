import { DAG } from '$lib/DAG'
import { clamp, relu, sigmoid } from '$lib/utils'
import { linearScale, max, min } from '@chasi/ui/utils'
import { BSpline } from './BSpline'

type BrainDag = {
	nodes: {
		input: (xs: number[]) => number
		hidden: (inputs: number[]) => number
		output: (inputs: number[]) => number
	}
	connections: {
		identity: (x: number) => number
		spline: (x: number, connid: any) => number
	}
}

export class Brain {
	#inputSize: number
	#outputSize: number
	splines: Map<string, BSpline> = new Map()
	dag: DAG<BrainDag>
	nControlPoints: number

	constructor(inputSize: number, outputSize: number, nControlPoints = 10) {
		this.nControlPoints = nControlPoints
		this.#inputSize = inputSize
		this.#outputSize = outputSize
		this.dag = new DAG({
			nodes: {
				input: (xs) => xs[0],
				hidden: sumAll,
				output: sumAll
			},
			connections: {
				identity: (x) => x,
				spline: (x, connid) => this.splines.get(connid)!.evaluate(x)
			}
		})

		const inputsIds = []
		for (let i = 0; i < inputSize; i++) {
			const id = this.dag.addNode('input')
			inputsIds.push(id)
		}

		for (let i = 0; i < outputSize; i++) {
			const oid = this.dag.addNode('output')
			inputsIds.forEach((id) => {
				this.#connectWithSpline(id, oid)
			})
		}
	}

	#connectWithSpline(from: string, to: string, spline?: BSpline) {
		if (spline) {
			this.splines.set(`${from}_${to}`, spline.clone())
		} else {
			this.splines.set(`${from}_${to}`, new BSpline(this.nControlPoints, 2))
		}
		this.dag.connect('spline', from, to)
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
		this.#connectWithSpline(from, to)
	}

	removeEdge() {
		if (this.dag.connections.size < this.dag.nodes.size) return
		const candidates: [string, string][] = []
		for (const [from, deps] of this.dag.graph) {
			if (deps.size > 1) {
				deps.forEach((to) => {
					let iter = 0
					for (const [from2, deps2] of this.dag.graph) {
						if (from2 !== from && deps2.has(to)) iter++
						if (iter > 2) {
							candidates.push([from, to])
							return
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
		this.#connectWithSpline(from, nuevoNodo, spline)
		this.#connectWithSpline(nuevoNodo, to)
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
					this.#connectWithSpline(input, output)
				}
			})
		})

		this.dag.removeNode(rNodeId)
		for (const [connid] of this.splines) {
			if (connid.includes(rNodeId)) this.splines.delete(connid)
		}
	}

	#disconnect(from: string, to: string) {
		const spline = this.splines.get(`${from}_${to}`)
		this.dag.disconnect(from, to)
		this.splines.delete(`${from}_${to}`)
		return spline!
	}

	async forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		const pr = await this.dag.process(inputs)
		const r: number[] = []
		for (const [id, { type, value }] of pr) {
			if (type === 'output') {
				r.push(value)
			}
		}
		return r
	}

	mutate() {
		if (Math.random() < 0.9) {
			this.splines.forEach((s) => s.mutate())
		} else {
			const probabilty = Math.floor(Math.random() * 5)
			if (probabilty === 0) this.addNode()
			if (probabilty === 1) this.addEdge()
			if (probabilty === 2) this.removeNode()
			if (probabilty === 3) this.removeEdge()
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize, this.nControlPoints)
		clone.dag = this.dag.clone(clone.dag.store)
		clone.splines.clear()
		for (const [id, spline] of this.splines) {
			clone.splines.set(id, spline.clone())
		}
		return clone
	}

	draw(width: number, height: number) {
		const g = this.dag.draw(width, height)
		const splines = g.connectionPositions.map((c) => ({
			spline: this.splines.get(`${c[4]}_${c[5]}`)!,
			x: (c[0] + c[1]) / 2,
			y: (c[2] + c[3]) / 2
		}))
		return {
			...g,
			splines
		}
	}
}

function sumAll(inputs: number[]) {
	const sum = inputs.reduce((prev, current) => prev + current, 0)
	// const ma = max(inputs)
	// const mi = min(inputs)
	// return linearScale(sum, 0, inputs.length, 0, 1)
	// return clamp(sum, 0, 1)
	// return sigmoid(sum)
	return relu(sum)
	// return sum / inputs.length
	// return Math.sin(sum)
}
function randomElement<T>(arr: T[]) {
	const i = Math.floor(Math.random() * arr.length)
	return arr[i]
}
