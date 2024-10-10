import { probably, silu } from '$lib/utils'

export class Brain {
	inputSize: number
	outputSize: number
	neurons: Neuron[] = []
	connections: { from: number; to: number; weight: number }[] = [] // Representaremos conexiones como índices para facilitar el orden topológico

	constructor(inputSize: number, outputSize: number) {
		this.inputSize = inputSize
		this.outputSize = outputSize

		// Crear neuronas de entrada y salida
		for (let i = 0; i < inputSize + outputSize; i++) {
			this.neurons.push(new Neuron(inputSize))
		}

		// Conectar directamente las neuronas de entrada a las de salida
		for (let i = 0; i < inputSize; i++) {
			for (let j = inputSize; j < inputSize + outputSize; j++) {
				this.connections.push({ from: i, to: j, weight: Math.random() })
			}
		}
	}

	clone() {
		const clonedBrain = new Brain(this.inputSize, this.outputSize)
		clonedBrain.neurons = this.neurons.map((neuron) => neuron.clone())
		clonedBrain.connections = this.connections.map((connection) => ({
			...connection
		}))
		return clonedBrain
	}

	forward(inputs: number[]) {
		if (inputs.length !== this.inputSize) {
			throw new Error(`Expected ${this.inputSize} inputs, received ${inputs.length}`)
		}

		// Asignar los inputs a las neuronas de entrada
		for (let i = 0; i < this.inputSize; i++) {
			this.neurons[i].output = inputs[i]
		}

		// Obtener el orden topológico de las neuronas
		const orderedIndices = this.#topologicalSort()

		// Evaluar en orden topológico
		orderedIndices.forEach((index) => {
			const neuron = this.neurons[index]
			const incomingConnections = this.connections.filter((conn) => conn.to === index)

			const inputValues = incomingConnections.map(
				(conn) => this.neurons[conn.from].output * conn.weight
			)
			neuron.output = neuron.predict(inputValues)
		})

		// Extraer los outputs finales
		return this.neurons
			.slice(this.inputSize, this.inputSize + this.outputSize)
			.map((neuron) => neuron.output)
	}

	mutate() {
		if (probably(0.3)) {
			this.#addNode()
		} else if (probably(0.3)) {
			this.#addConnection()
		}
	}

	#addNode() {
		// Elegir una conexión existente para dividir
		const connection = this.connections[Math.floor(Math.random() * this.connections.length)]

		// Crear una nueva neurona y dividir la conexión existente
		const newNeuron = new Neuron(this.inputSize)
		this.neurons.push(newNeuron)
		const newNeuronIndex = this.neurons.length - 1

		this.connections = this.connections.filter((conn) => conn !== connection)
		this.connections.push(
			{ from: connection.from, to: newNeuronIndex, weight: Math.random() },
			{ from: newNeuronIndex, to: connection.to, weight: Math.random() }
		)
	}

	#addConnection() {
		// Elegir dos neuronas aleatorias para conectar, respetando la dirección para mantener el grafo acíclico
		const fromIndex = Math.floor(Math.random() * this.neurons.length)
		const toIndex = Math.floor(Math.random() * this.neurons.length)

		if (fromIndex !== toIndex && !this.#connectionExists(fromIndex, toIndex)) {
			this.connections.push({
				from: fromIndex,
				to: toIndex,
				weight: Math.random()
			})
		}
	}

	#connectionExists(from: number, to: number): boolean {
		return this.connections.some((conn) => conn.from === from && conn.to === to)
	}

	#topologicalSort() {
		const visited: boolean[] = new Array(this.neurons.length).fill(false)
		const stack: number[] = []

		const visit = (node: number) => {
			if (!visited[node]) {
				visited[node] = true
				this.connections.filter((conn) => conn.from === node).forEach((conn) => visit(conn.to))
				stack.push(node)
			}
		}

		for (let i = 0; i < this.neurons.length; i++) {
			if (!visited[i]) visit(i)
		}

		return stack.reverse()
	}
}

class Neuron {
	weights: number[]
	bias = Math.random()
	output = 0

	constructor(inputs: number) {
		this.weights = Array.from({ length: inputs }, () => Math.random())
	}

	predict(inputs: number[]) {
		if (inputs.length !== this.weights.length) {
			throw new Error(
				`Invalid input length, expected: ${this.weights.length}, received: ${inputs.length}`
			)
		}

		let sum = 0
		inputs.forEach((input, i) => {
			sum += input
		})

		return silu(sum + this.bias)
	}

	clone() {
		const clone = new Neuron(this.weights.length)
		clone.weights = [...this.weights]
		clone.bias = this.bias
		return clone
	}
}
