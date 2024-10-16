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

	constructor(inputSize: number, outputSize: number, opt?: BrainOptions) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		this.#mutationRate = opt?.mutationRate || 0.3
		this.#mutationLayerRate = opt?.mutationLayerRate || 0.05

		this.layers = [new Layer(inputSize, outputSize)]
	}

	forward(inputs: number[]) {
		// Propagar a través de todas las capas
		let outputs = inputs
		for (const layer of this.layers) {
			outputs = layer.forward(outputs)
		}
		return outputs
	}

	addLayer() {
		const inputs = this.layers[0].inputs
		this.layers = [new Layer(this.#inputSize, inputs), ...this.layers]
	}

	mutate() {
		if (probably(this.#mutationRate)) {
			this.layers.forEach((l) => l.mutate())
		}
		const complexity = 1 / (1 + this.layers.length)
		if (probably(this.#mutationLayerRate * complexity)) {
			this.addLayer()
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}
