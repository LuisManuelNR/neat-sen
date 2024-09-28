import { linearScale } from '@chasi/ui/utils'
import { BSpline } from './BSpline'

class Neuron {}

// por ahora es muy simple
// falta tener multiples splines por inputs
// y por ende otra capa de splines (out)
// para poder sacar un valor
class Layer {
	splines: BSpline[] = []
	#inputs: number
	#outputs: number
	constructor(inputs: number, outputs: number) {
		this.#inputs = inputs
		this.#outputs = outputs
		for (let i = 0; i < inputs * outputs; i++) {
			this.splines.push(new BSpline())
		}
	}

	forward(inputs: number[]) {
		if (inputs.length !== this.#inputs) throw new Error('Input layer mismatch')

		const results: number[] = new Array(this.#outputs).fill(0) // Inicializa el array de resultados

		// Itera sobre cada input
		for (let i = 0; i < this.#inputs; i++) {
			// Cada input se pasa a las splines correspondientes
			for (let j = 0; j < this.#outputs; j++) {
				// La spline correspondiente es la que está en el índice i * outputs + j
				const splineIndex = i * this.#outputs + j
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
	layers: Layer[] = []
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

		this.addLayer(this.#inputSize, this.#outputSize)

		this.#dataDomain = opt.dataDomain
	}

	addLayer(inputs: number, outputs: number) {
		this.layers = [...this.layers, new Layer(inputs, outputs)]
	}

	forward(inputs: number[]) {
		this.inputs = inputs.map((v) => linearScale(v, this.#dataDomain[0], this.#dataDomain[1], -1, 1))
		this.outputs = this.layers[0].forward(this.inputs)
	}
}
