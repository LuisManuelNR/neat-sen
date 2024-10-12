import { DAG, DAGUnit } from '$lib/DAG'
import { probably, silu } from '$lib/utils'

export class Brain {
	inputSize: number
	outputSize: number
	neurons: Neuron[] = []
	dag = new DAG()

	constructor(inputSize: number, outputSize: number) {
		this.inputSize = inputSize
		this.outputSize = outputSize

		for (let i = 0; i < inputSize + outputSize; i++) {
			const neuron = new Neuron()
			this.neurons.push(neuron)
			this.dag.add(neuron.dagUnit)
		}

		for (let i = 0; i < inputSize; i++) {
			for (let j = 0; j < outputSize; j++) {
				const inputIndex = i // Índice de neurona de entrada
				const outputIndex = inputSize + j // Índice de neurona de salida
				this.dag.connect(inputIndex, outputIndex)
			}
		}
	}

	clone() {}

	async forward(inputs: number[]) {
		if (inputs.length !== this.inputSize) {
			throw new Error(`Expected ${this.inputSize} inputs, received ${inputs.length}`)
		}

		for (let i = 0; i < inputs.length; i++) {
			this.neurons[i].dagUnit.output = inputs[i]
		}

		await this.dag.process()

		const outputs: number[] = []
		for (let i = this.outputSize; i > 0; i--) {
			outputs.push(this.neurons[i].dagUnit.output)
		}
		return outputs
	}

	mutate() {
		if (probably(0.3)) {
			this.addNode()
		} else if (probably(0.3)) {
			this.addConnection()
		}
	}

	addNode() {}

	addConnection() {}
}

class Neuron {
	weights: number[] = []
	bias = Math.random()
	dagUnit: DAGUnit

	constructor() {
		this.dagUnit = new DAGUnit({
			inputTest: 0,
			outputTest: 0,
			evaluate: (input) => {
				if (input.length !== this.weights.length) {
					throw new Error(
						`Invalid input length, expected: ${this.weights.length}, received: ${input.length}`
					)
				}
				let sum = 0
				input.forEach((input, i) => {
					sum += input
				})

				return silu(sum + this.bias)
			}
		})

		this.dagUnit.on('connect', () => {
			this.weights.push(Math.random())
		})
	}

	clone() {
		const clone = new Neuron()
		clone.weights = [...this.weights]
		clone.bias = this.bias
		return clone
	}
}
