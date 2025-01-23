import { BSpline } from './BSpline'
import { linspace, sigmoid, silu } from '$lib/utils'
export class Layer {
	splines: BSpline[] = []
	inputs: number
	outputs: number

	constructor(inputs: number, outputs: number) {
		this.inputs = inputs
		this.outputs = outputs

		for (let i = 0; i < outputs * inputs; i++) {
			const spline = new BSpline(4)
			this.splines.push(spline)
		}
	}

	forward(inputs: number[]): number[] {
		if (inputs.length !== this.inputs) {
			throw new Error(`Expected ${this.inputs} inputs, but got ${inputs.length}`)
		}
		const results = new Array(this.outputs).fill(0)
		// Recorremos cada output
		for (let o = 0; o < this.outputs; o++) {
			// Para cada output, sumamos el resultado de cada spline correspondiente a los inputs
			for (let i = 0; i < this.inputs; i++) {
				const s = o * this.inputs + i // Índice correcto del spline
				const respusta = this.splines[s].evaluate(inputs[i])
				results[o] += respusta
			}
		}
		return results.map(v => v / inputs.length)
	}

	mutate() {
		this.splines.forEach((spline) => {
			if (Math.random() < 0.3) {
				spline.mutate()
			}
		})
	}

	clone(): Layer {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map((spline) => spline.clone())
		return clone
	}
}
