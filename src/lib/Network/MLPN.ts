import { DAG } from '$lib/DAG'
import {
	clamp,
	randomElement,
	randomGaussian,
	relu,
	sigmoid,
	sigmoidAct,
	silu,
	tanhAct
} from '$lib/utils'
import { randomNumber } from '@chasi/ui/utils'

type ActivationFunction = (x: number, derivate?: boolean) => number

const activation: Record<string, ActivationFunction> = {
	LOGISTIC: (x, derivate = false) => {
		const fx = 1 / (1 + Math.exp(-x))
		return derivate ? fx * (1 - fx) : fx
	},
	TANH: (x, derivate = false) => {
		return derivate ? 1 - Math.pow(Math.tanh(x), 2) : Math.tanh(x)
	},
	IDENTITY: (x, derivate = false) => {
		return derivate ? 1 : x
	},
	STEP: (x, derivate = false) => {
		return derivate ? 0 : x > 0 ? 1 : 0
	},
	RELU: (x, derivate = false) => {
		return derivate ? (x > 0 ? 1 : 0) : Math.max(0, x)
	},
	SOFTSIGN: (x, derivate = false) => {
		const d = 1 + Math.abs(x)
		return derivate ? x / Math.pow(d, 2) : x / d
	},
	SINUSOID: (x, derivate = false) => {
		return derivate ? Math.cos(x) : Math.sin(x)
	},
	GAUSSIAN: (x, derivate = false) => {
		const d = Math.exp(-Math.pow(x, 2))
		return derivate ? -2 * x * d : d
	},
	BENT_IDENTITY: (x, derivate = false) => {
		const d = Math.sqrt(Math.pow(x, 2) + 1)
		return derivate ? x / (2 * d) + 1 : (d - 1) / 2 + x
	},
	BIPOLAR: (x, derivate = false) => {
		return derivate ? 0 : x > 0 ? 1 : -1
	},
	BIPOLAR_SIGMOID: (x, derivate = false) => {
		const d = 2 / (1 + Math.exp(-x)) - 1
		return derivate ? (1 / 2) * (1 + d) * (1 - d) : d
	},
	HARD_TANH: (x, derivate = false) => {
		return derivate ? (x > -1 && x < 1 ? 1 : 0) : Math.max(-1, Math.min(1, x))
	},
	ABSOLUTE: (x, derivate = false) => {
		return derivate ? (x < 0 ? -1 : 1) : Math.abs(x)
	},
	INVERSE: (x, derivate = false) => {
		return derivate ? -1 : 1 - x
	},
	// https://arxiv.org/pdf/1706.02515.pdf
	SELU: (x, derivate = false) => {
		const alpha = 1.6732632423543772848170429916717
		const scale = 1.0507009873554804934193349852946
		const fx = x > 0 ? x : alpha * Math.exp(x) - alpha
		return derivate ? (x > 0 ? scale : (fx + alpha) * scale) : fx * scale
	}
}

export class Brain {
	#inputSize: number
	#outputSize: number
	weights: Map<string, number> = new Map()
	biases: Map<string, number> = new Map()
	dag = new DAG({
		nodes: {
			input: (xs: number[]) => xs[0],

			LOGISTIC: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.LOGISTIC(sum)
			},

			TANH: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.TANH(sum)
			},

			IDENTITY: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.IDENTITY(sum)
			},

			STEP: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.STEP(sum)
			},

			RELU: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.RELU(sum)
			},

			SOFTSIGN: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.SOFTSIGN(sum)
			},

			SINUSOID: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.SINUSOID(sum)
			},

			GAUSSIAN: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.GAUSSIAN(sum)
			},

			BENT_IDENTITY: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.BENT_IDENTITY(sum)
			},

			BIPOLAR: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.BIPOLAR(sum)
			},

			BIPOLAR_SIGMOID: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.BIPOLAR_SIGMOID(sum)
			},

			HARD_TANH: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.HARD_TANH(sum)
			},

			ABSOLUTE: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.ABSOLUTE(sum)
			},

			INVERSE: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.INVERSE(sum)
			},

			SELU: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.SELU(sum)
			},

			output: (inputs: number[], nodeid: string) => {
				const sum = inputs.reduce((p, c) => p + c, this.biases.get(nodeid)!)
				return activation.LOGISTIC(sum) // O usa `sigmoid(sum)` si tienes una función específica
			}
		},
		connections: {
			multiply: (x: number, connid) => {
				return this.weights.get(connid)! * x
			}
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
			this.biases.set(oid, randomGaussian(0, 0.1))
			inputsIds.forEach((id) => {
				this.#connect(id, oid)
			})
		}
	}

	#connect(from: string, to: string) {
		const connid = this.dag.connect('multiply', from, to)
		if (!connid) return
		this.weights.set(connid, Math.random())
	}

	#disconnect(from: string, to: string) {
		const connid = this.dag.disconnect(from, to)
		if (!connid) return
		this.weights.delete(connid)
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
		this.#disconnect(from, to)

		// 4. Crear un nuevo nodo
		const nodetype = randomElement(Object.keys(activation))
		const nuevoNodo = this.dag.addNode(nodetype)
		this.biases.set(nuevoNodo, randomGaussian(0, 0.1))

		// 5. Establecer nuevas conexiones
		this.#connect(from, nuevoNodo)
		this.#connect(nuevoNodo, to)
	}

	removeNode() {
		if (this.dag.nodes.size === this.#inputSize + this.#outputSize) return
		const hiddens: string[] = []
		for (const [id, type] of this.dag.nodes) {
			if (type !== 'input' && type !== 'output') hiddens.push(id)
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
		this.biases.delete(rNodeId)
		for (const [connid] of this.weights) {
			if (connid.includes(rNodeId)) this.weights.delete(connid)
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
		}
		return r
	}

	mutate() {
		const probabilty = Math.floor(Math.random() * 5)
		if (probabilty === 0) this.addNode()
		if (probabilty === 1) this.addEdge()
		if (probabilty === 2) this.removeNode()
		if (probabilty === 3) this.removeEdge()
		if (probabilty === 4) {
			this.weights.forEach((value, key, map) => {
				if (Math.random() < 0.2) {
					value += randomGaussian(0, 0.1)
					// value = clamp(value, 0, 1)
					map.set(key, value) // Modificar el valor en el Map
				}
			})
			this.biases.forEach((value, key, map) => {
				if (Math.random() < 0.1) {
					value += randomGaussian(0, 0.1)
					// value = clamp(value, 0, 1)
					map.set(key, value) // Modificar el valor en el Map
				}
			})
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.dag = this.dag.clone(clone.dag.store)
		clone.weights = structuredClone(this.weights)
		clone.biases = structuredClone(this.biases)
		return clone
	}
	draw(width: number, height: number) {
		return this.dag.draw(width, height)
		// const g = this.dag.draw(width, height)
		// const splines = g.connectionPositions.map((c) => ({
		// 	spline: this.splines.get(`${c[4]}_${c[5]}`)!,
		// 	x: (c[0] + c[1]) / 2,
		// 	y: (c[2] + c[3]) / 2
		// }))
		// return {
		// 	...g,
		// 	splines
		// }
	}
}
