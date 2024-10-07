import { randomNumber } from '@chasi/ui/utils'
import { BSpline } from './BSpline'
export class Layer {
	splines: BSpline[] = []
	inputs: number
	outputs: number

	constructor(inputs: number, outputs: number) {
		this.inputs = inputs
		this.outputs = outputs

		// Crear splines para cada combinación de input y output
		for (let i = 0; i < outputs * inputs; i++) {
			const points = Math.floor(randomNumber(2, 10))
			this.splines.push(new BSpline(points))
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
				const splineIndex = o * this.inputs + i // Índice correcto del spline
				const splineValue = this.splines[splineIndex].evaluate(inputs[i])
				results[o] += splineValue
			}
		}
		return results.map((n) => n / this.inputs)
	}

	mutate() {
		this.splines.forEach((spline) => {
			spline.mutate()
		})
	}

	clone(): Layer {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map((spline) => spline.clone())
		return clone
	}
}
