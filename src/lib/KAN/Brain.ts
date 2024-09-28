import { linearScale, randomNumber } from '@chasi/ui/utils'
import { BSpline } from './BSpline'

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

		// Devuelve los resultados que tienen la longitud de outputs
		return results
	}
}

type NetworkOptions = {
	inputSize: number
	outputSize: number
	dataDomain: [number, number]
}
export class Brain {
	layers: Layer[]
	#inputSize: number
	#outputSize: number
	#dataDomain: [number, number]
	inputs: number[]
	outputs: number[]

	constructor(opt: NetworkOptions) {
		this.#inputSize = opt.inputSize
		this.#outputSize = opt.outputSize

		this.inputs = new Array(this.#inputSize).fill(0)
		this.outputs = new Array(this.#outputSize).fill(0)

		this.layers = [new Layer(this.#inputSize, this.#outputSize)]

		this.#dataDomain = opt.dataDomain
	}

	addLayer() {
		const inputs = this.layers.at(-1)!.outputs
		const outputs = Math.floor(randomNumber(1, 7))
		this.layers = [...this.layers, new Layer(inputs, outputs), new Layer(outputs, this.#outputSize)]
	}

	forward(inputs: number[]) {
		console.time('forward')
		this.inputs = inputs.map((v) => linearScale(v, this.#dataDomain[0], this.#dataDomain[1], -1, 1))

		// Propagar a través de todas las capas
		let outputs = structuredClone(this.inputs)
		for (const layer of this.layers) {
			outputs = layer.forward(outputs)
		}

		this.outputs = outputs
		console.timeEnd('forward')
	}
}
