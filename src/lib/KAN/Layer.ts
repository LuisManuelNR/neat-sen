import { linearScale, max, min } from '@chasi/ui/utils'
import { BSpline } from './BSpline'
import { linspace, sigmoid, silu } from '$lib/utils'
export class Layer {
	splines: BSpline[] = []
	inputs: number
	outputs: number
	mutRate = 1

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
				// console.log(`input ${i} = ${inputs[i]} evaluado contra spline ${s} = ${respusta}`)
				results[o] += respusta
			}
		}
		// for (let o = 0; o < this.outputs; o++) {
		// 	for (let i = 0; i < this.inputs; i++) {
		// 		let sum = 0
		// 		for (let s = 0; s < this.splines.length; s++) {
		// 			const respusta = this.splines[s].evaluate(inputs[i])
		// 			console.log(`input ${i} = ${inputs[i]} evaluado contra ${s} = ${respusta}`)
		// 			sum = respusta
		// 		}
		// 		results[o] += sum
		// 	}
		// }
		// console.log(results)
		// const minO = min([0, ...results, 1])
		// const maxO = max([0, ...results, 1])
		// return results.map((n) => linearScale(n, minO, maxO, 0, 1))
		return results.map(sigmoid)
		// return results.map(Math.tanh)
		// return results.map(silu)
		// return results
	}

	mutate() {
		// if (this.mutRate < 0) return
		this.splines.forEach((spline) => {
			spline.mutate()
		})
		// this.mutRate -= 0.001
	}

	clone(): Layer {
		const clone = new Layer(this.inputs, this.outputs)
		clone.splines = this.splines.map((spline) => spline.clone())
		return clone
	}
}
