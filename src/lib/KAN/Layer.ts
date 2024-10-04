import { max } from '@chasi/ui/utils'
import { BSpline } from './BSpline'
import { relu, silu } from './funcs'
let layers = 0
export class Layer {
	splines: BSpline[] = []
	inputs: number
	outputs: number

	constructor(inputs: number, outputs: number) {
		this.inputs = inputs
		this.outputs = outputs
		layers++

		// Crear splines para cada combinación de input y output
		for (let i = 0; i < outputs * inputs; i++) {
			this.splines.push(new BSpline(8))
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
		return results.map((n) => n / this.inputs)
	}

	mutate() {
		this.splines.forEach((spline) => {
			spline.mutate()
		})
	}

	updateOutputs(newOutputs: number) {
		const newSplines: BSpline[] = []

		// Mantener los splines antiguos si es posible
		for (let o = 0; o < newOutputs; o++) {
			for (let i = 0; i < this.inputs; i++) {
				const oldIndex = o * this.inputs + i
				if (o < this.outputs) {
					newSplines.push(this.splines[oldIndex]) // Mantener spline existente
				} else {
					newSplines.push(new BSpline(8)) // Crear nuevos splines si es necesario
				}
			}
		}

		// Actualizar outputs y los splines
		this.outputs = newOutputs
		this.splines = newSplines
	}

	clone(): Layer {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map((spline) => spline.clone())
		return clone
	}
}
