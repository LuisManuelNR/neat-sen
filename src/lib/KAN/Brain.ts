import { DAG } from '$lib/DAG'
import { BSpline } from './BSpline'

export class Brain {
	#inputSize: number
	#outputSize: number
	splines: Map<number, BSpline> = new Map()
	dag: DAG

	constructor(inputSize: number, outputSize: number) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize
		this.dag = new DAG()

		const inputsIds = []
		for (let i = 0; i < inputSize; i++) {
			const id = this.dag.add(inputfn)
			inputsIds.push(id)
		}

		for (let i = 0; i < outputSize; i++) {
			const oid = this.dag.add(sumAll)
			inputsIds.forEach((id) => {
				this.#connectWithSpline(id, oid)
			})
		}
	}

	#connectWithSpline(from: number, to: number) {
		this.splines.set(from, new BSpline(10))
		this.dag.connect(from, to, (input: number) => this.splines.get(from)!.evaluate(input))
	}

	addEdge() {
		const sorted = this.dag.sort()
		if (!sorted) return

		const available: number[][] = []
		const prevBatch: number[] = []
		for (let i = 1; i < sorted.length; i++) {
			const batch = sorted[i]
			prevBatch.push(...sorted[i - 1])
			batch.forEach((nodeid) => {
				prevBatch.forEach((n) => {
					const node = this.dag.connections.get(n)!
					if (!node.has(nodeid)) {
						available.push([n, nodeid])
					}
				})
			})
		}
		if (available.length === 0) return
		const pair = available[Math.floor(Math.random() * available.length)]
		this.#connectWithSpline(pair[0], pair[1])
	}

	// removeEdge() {
	// 	const maxConn = this.dag.connections.size
	// }

	addNode() {
		try {
			// 1. Filtrar las conexiones existentes
			const conexiones: Array<[number, number]> = []
			this.dag.connections.forEach((destinos, from) => {
				destinos.forEach((to) => {
					conexiones.push([from, to])
				})
			})

			if (conexiones.length === 0) return

			// 2. Seleccionar una conexión aleatoria
			const [[from, to]] = randomElement(conexiones)

			// 3. Desconectar la conexión seleccionada
			this.dag.disconnect(from, to)

			// 4. Crear un nuevo nodo
			const nuevoNodo = this.dag.add(sumAll)

			// 5. Establecer nuevas conexiones
			this.splines.set(from, new BSpline(10))
			this.dag.connect(from, nuevoNodo, (input: number) => {
				return this.splines.get(from)!.evaluate(input)
			})

			this.splines.set(nuevoNodo, new BSpline(10))
			this.dag.connect(nuevoNodo, to, (input: number) => {
				return this.splines.get(nuevoNodo)!.evaluate(input)
			})
		} catch (error) {}
	}

	// removeNode() {
	// 	if (this.dag.nodes.size === this.#inputSize + this.#outputSize) return

	// 	const [rNodeId, index] = randomElement(this.hiddenIds)
	// 	const sorted = this.dag.remove(rNodeId)
	// 	this.hiddenIds.splice(index, 1)
	// 	this.splines.delete(rNodeId)

	// 	const emptyConnections = []
	// 	for (const [id, deps] of this.dag.connections) {
	// 		if (this.outputsIds.indexOf(id) !== -1) continue
	// 		if (deps.size === 0) emptyConnections.push(id)
	// 	}
	// 	if (!emptyConnections.length) return
	// 	console.log(sorted)
	// 	emptyConnections.forEach((id) => {
	// 		let aviableToNodes = this.hiddenIds.filter((v) => v > id)
	// 		if (!aviableToNodes.length) aviableToNodes = this.outputsIds
	// 		const [to] = randomElement(aviableToNodes)
	// 		this.splines.set(id, new BSpline(10))
	// 		console.log('connect', id, to)
	// 		this.dag.connect(id, to, (input: number) => {
	// 			return this.splines.get(id)!.evaluate(input)
	// 		})
	// 	})
	// }

	forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		return this.dag.process(inputs)
	}

	mutate() {
		if (Math.random() < 0.8) {
			this.splines.forEach((s) => s.mutate())
		}
		// if (Math.random() < 0.01) {
		// 	const probabilty = Math.floor(Math.random() * 3)
		// 	if (probabilty === 0) this.addNode()
		// 	if (probabilty === 1) this.addEdge()
		// }
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.dag = this.dag
		clone.splines = this.splines
		return clone
	}
}

function sumAll(inputs: number[]) {
	const sum = inputs.reduce((prev, current) => prev + current, 0)
	return sum / inputs.length
}
function inputfn(inputs: number[]) {
	return inputs[0]
}
function randomElement<T>(arr: T[]): [T, number] {
	const i = Math.floor(Math.random() * arr.length)
	return [arr[i], i]
}
