import { Layer } from './Layer'
import { probably, silu } from '$lib/utils'
import { DAG, DAGUnit } from '$lib/DAG'
import { BSpline } from './BSpline'
import { max, randomNumber } from '@chasi/ui/utils'

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
			iids.forEach(id => {
				this.dag.connect(id, oid)
			})
		}
	}

	addEdge() {
		// const sorted = this.dag.sort()
		// if (!sorted || sorted.length < 3) return
		// const [inputs, hidden, outputs] = sorted

		const available = []
		const nodeids = [...this.dag.nodes.keys()]
		for (let i = 0; i < nodeids.length - this.#outputSize; i++) {
			const node1 = nodeids[i]
			for (let j = Math.max(i + 1, this.#inputSize); j < nodeids.length; j++) {
				const node2 = nodeids[j]
				if (!this.dag.connections.get(node1)?.has(node2)) {
					available.push([node1, node2])
				}
			}
		}
		if (available.length === 0) return
		const pair = available[Math.floor(Math.random() * available.length)]
		this.dag.connect(pair[0], pair[1])
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
			this.dag.connect(from, nuevoNodo)
			this.dag.connect(nuevoNodo, to)
		} catch (error) {

		}
	}

	forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		return this.dag.process(inputs)
	}

	mutate() {
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		return clone
	}
}

function sumAll(inputs: number[]) {
	// const sum = inputs.reduce((prev, current) => prev + current, 0)
	// const m = max(inputs)
	// return sum / m
	return inputs.reduce((prev, current) => prev + current, 0)
}
function inputfn(inputs: number[]) {
	return inputs[0]
}