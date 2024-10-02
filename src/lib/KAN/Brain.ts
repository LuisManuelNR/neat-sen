import { normalize } from '$lib/utils'
import { BSpline } from './BSpline'
import { linearScale, max, min, randomNumber } from '@chasi/ui/utils'

class Layer {
	splines: BSpline[] = []
	inputs: number
	outputs: number
	constructor(inputs: number, outputs: number) {
		this.inputs = inputs
		this.outputs = outputs
		for (let i = 0; i < inputs * outputs; i++) {
			this.splines.push(new BSpline())
		}
	}

	forward(inputs: number[]) {
		if (inputs.length !== this.inputs) throw new Error('Input layer mismatch')
		const results: number[] = new Array(this.outputs).fill(0) // Inicializa el array de resultados

		// Itera sobre cada input
		for (let i = 0; i < this.inputs; i++) {
			// Cada input se pasa a las splines correspondientes
			for (let j = 0; j < this.outputs; j++) {
				// La spline correspondiente es la que está en el índice i * outputs + j
				const splineIndex = i * this.outputs + j
				const spline = this.splines[splineIndex]

				// Evalúa el input con la spline y suma el resultado al output correspondiente
				results[j] += spline.evaluate(inputs[i])
			}
		}
		// return results
		const minO = min(inputs)
		const maxO = max(inputs)
		return results.map(o => linearScale(o, minO, maxO, 0, 1))
	}

	mutate() {
		this.splines.forEach((spline) => spline.mutate())
	}

	clone() {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map((s) => s.clone())
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

		this.#mutationRate = opt?.mutationRate || 0.05
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
		const complexityFactor = 0.1 / (this.layers.length + 1) // Disminuye a medida que la red crece
		if (probably(this.#mutationLayerRate * complexityFactor)) {
			this.addLayer()
		}
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
