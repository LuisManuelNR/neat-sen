import { normalize } from '$lib/utils'
import { BSpline } from './BSpline'
import { linearScale, max, min, randomNumber } from '@chasi/ui/utils'

class Layer {
	splines: BSpline[] = [];
	inputs: number
	outputs: number
	maxV: number

	constructor(inputs: number, outputs: number) {
		this.inputs = inputs
		this.outputs = outputs
		this.maxV = 1

		// Crear splines para cada combinación de input y output
		for (let i = 0; i < inputs * outputs; i++) {
			this.splines.push(new BSpline(7))
		}
	}

	forward(inputs: number[]): number[] {
		if (inputs.length !== this.inputs) throw new Error('Input layer mismatch')

		const results: number[] = new Array(this.outputs).fill(0)

		// Para cada salida (q)
		for (let q = 0; q < this.outputs; q++) {
			let sum = 0

			// Para cada entrada (p)
			for (let p = 0; p < this.inputs; p++) {
				const splineIndex = q * this.inputs + p
				const spline = this.splines[splineIndex]

				// Evaluar la spline para el input correspondiente
				sum += spline.evaluate(inputs[p])
			}

			if (sum > this.maxV) this.maxV = sum
			// Evaluar la spline \Phi_q para la suma normalizada
			results[q] = sum / this.maxV
		}

		return results
	}

	// Mutar todas las splines
	mutate() {
		this.splines.forEach((spline) => {
			if (probably(0.5)) {
				spline.mutate()
			}
		})
	}

	clone(): Layer {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map(spline => spline.clone())
		return clone
	}
}


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

		this.layers = [new Layer(this.#inputSize, this.#outputSize)]
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
		// const complexityFactor = 0.1 / (this.layers.length + 1) // Disminuye a medida que la red crece
		// if (probably(this.#mutationLayerRate * complexityFactor)) {
		// 	this.addLayer()
		// }
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}

function probably(rate: number) {
	return Math.random() < rate
}
