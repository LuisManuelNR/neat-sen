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

		const iids = []
		for (let i = 0; i < inputSize; i++) {
			const id = this.dag.add(inputfn)
			iids.push(id)
		}

		for (let i = 0; i < outputSize; i++) {
			const oid = this.dag.add(sumAll)
			iids.forEach((id) => {
				this.splines.set(id, new BSpline(10))
				this.dag.connect(id, oid, (input: number) => this.splines.get(id)!.evaluate(input))
			})
		}
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
		this.splines.set(pair[0], new BSpline(10))
		this.dag.connect(pair[0], pair[1], (input: number) =>
			this.splines.get(pair[0])!.evaluate(input)
		)
	}

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
			const [from, to] = conexiones[Math.floor(Math.random() * conexiones.length)]

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

	forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		return this.dag.process(inputs)
	}

	mutate() {
		const probabilty = Math.floor(Math.random() * 4)
		if (probabilty === 0) this.addNode()
		if (probabilty === 1) this.addEdge()
		if (probabilty === 2) {
			this.splines.forEach((s) => {
				if (Math.random() < 0.2) {
					s.mutate()
				}
			})
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
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
