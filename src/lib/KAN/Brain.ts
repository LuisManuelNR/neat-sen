import { Layer } from './Layer'
export class Brain {
	#inputSize: number
	#outputSize: number
	layers: Layer[] = []

	constructor(...args: number[]) {
		this.#inputSize = args[0]
		this.#outputSize = args.at(-1)!
		for (let i = 0; i < args.length; i++) {
			const current = args[i]
			const next = args[i + 1]
			if (!next) return
			this.layers.push(new Layer(current, next))
		}
	}

	forward(inputs: number[]) {
		// Propagar a través de todas las capas
		let outputs = inputs
		for (const layer of this.layers) {
			outputs = layer.forward(outputs)
		}
		return outputs
	}

	mutate() {
		if (Math.random() < 0.2) {
			this.layers.forEach((l) => l.mutate())
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}