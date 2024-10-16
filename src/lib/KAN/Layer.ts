import { linearScale, max, min } from '@chasi/ui/utils'
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
			this.splines.push(new BSpline(4, 3))
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
				results[o] += this.splines[splineIndex].evaluate(inputs[i])
			}
		}
		const minO = min([-1, ...results, 1])
		const maxO = max([-1, ...results, 1])
		return results.map((n) => linearScale(n, minO, maxO, 0, 1))
		// return results.map(silu)
		// return results.map(Math.tanh)
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
