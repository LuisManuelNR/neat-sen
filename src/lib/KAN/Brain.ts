import { randomNumber } from '@chasi/ui/utils'
import { Layer } from './Layer'
import { probably } from '$lib/utils'

type BrainOptions = {
	mutationRate?: number
	mutationLayerRate?: number
}
export class Brain {
	layers: Layer[]
	#inputSize: number
	#outputSize: number
	#mutationRate: number
	#mutationLayerRate: number
	inputs: number[]
	outputs: number[]

	constructor(inputSize: number, outputSize: number, opt?: BrainOptions) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		this.#mutationRate = opt?.mutationRate || 0.3
		this.#mutationLayerRate = opt?.mutationLayerRate || 0.01

		this.inputs = new Array(this.#inputSize).fill(0)
		this.outputs = new Array(this.#outputSize).fill(0)

		this.layers = [new Layer(inputSize, outputSize)]
	}

	forward(inputs: number[]) {
		this.inputs = inputs

		// Propagar a través de todas las capas
		let outputs = this.inputs
		for (const layer of this.layers) {
			outputs = layer.forward(outputs)
		}

		this.outputs = outputs
	}

	addLayer() {
		const inputs = this.layers.at(-1)!.outputs
		const outputs = Math.floor(randomNumber(1, 9))
		this.layers = [...this.layers, new Layer(inputs, outputs), new Layer(outputs, this.#outputSize)]
	}

	mutate() {
		if (probably(this.#mutationRate)) {
			this.layers.forEach((l) => l.mutate())
		}
		const complexityFactor = 0.1 / (this.layers.length + 1) // Disminuye a medida que la red crece
		if (probably(complexityFactor)) {
			this.addLayer()
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}
