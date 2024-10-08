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

	constructor(inputSize: number, outputSize: number, opt?: BrainOptions) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		this.#mutationRate = opt?.mutationRate || 0.8
		this.#mutationLayerRate = opt?.mutationLayerRate || 0.1

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
		const inputs = Math.round(randomNumber(1, 5))
		const outputs = this.layers.at(-1)!.outputs
		this.layers = [...this.layers, new Layer(outputs, inputs), new Layer(inputs, this.#outputSize)]
	}

	mutate() {
		if (probably(this.#mutationRate)) {
			this.layers.forEach((l) => l.mutate())
		}
		const complexity = 1 / (1 + this.layers.length + 1)
		if (probably(0.05 * complexity)) {
			this.addLayer()
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}
