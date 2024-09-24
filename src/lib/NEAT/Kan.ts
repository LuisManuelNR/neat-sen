import { Vec2D } from '../utils'
import { Spline } from './Spline'

export class KANNetwork {
	#inputDim: number
	#outputDim: number
	#numFunctions: number
	coefficients: number[][] // Coeficientes para las combinaciones lineales
	splines: Spline[][] // Splines en los bordes

	constructor(inputDim: number, numFunctions: number, outputDim: number) {
		this.#inputDim = inputDim
		this.#numFunctions = numFunctions
		this.#outputDim = outputDim

		// Inicializar coeficientes de combinaciones lineales
		this.coefficients = this.#initializeCoefficients()
		// Inicializar splines
		this.splines = this.#initializeSplines()
	}

	#initializeCoefficients(): number[][] {
		const coefficients: number[][] = []
		for (let i = 0; i < this.#numFunctions; i++) {
			const funcCoefficients: number[] = []
			for (let j = 0; j < this.#inputDim; j++) {
				funcCoefficients.push(Math.random())
			}
			coefficients.push(funcCoefficients)
		}
		return coefficients
	}

	#initializeSplines(): Spline[][] {
		const splinesArray: Spline[][] = []
		for (let i = 0; i < this.#numFunctions; i++) {
			const splineFunctions: Spline[] = []
			for (let j = 0; j < this.#outputDim; j++) {
				// Inicializamos splines básicos con puntos de control iniciales
				const points = [new Vec2D(0, Math.random()), new Vec2D(1, Math.random()), new Vec2D(2, Math.random())]
				splineFunctions.push(new Spline(points))
			}
			splinesArray.push(splineFunctions)
		}
		return splinesArray
	}

	forward(input: number[]): number[] {
		const outputs: number[] = new Array(this.#outputDim).fill(0)

		for (let outIdx = 0; outIdx < this.#outputDim; outIdx++) {
			let sum = 0
			for (let funcIdx = 0; funcIdx < this.#numFunctions; funcIdx++) {
				const linearResult = this.#linearCombination(input, this.coefficients[funcIdx])
				const splineResult = this.splines[funcIdx][outIdx].evaluate(linearResult)
				sum += splineResult
			}
			outputs[outIdx] = sum
		}

		return outputs
	}

	#linearCombination(input: number[], coefficients: number[]): number {
		return input.reduce((sum, val, i) => sum + val * coefficients[i], 0)
	}

	mutate(mutationRate: number): void {
		// Mutar coeficientes lineales
		for (let i = 0; i < this.#numFunctions; i++) {
			for (let j = 0; j < this.#inputDim; j++) {
				this.coefficients[i][j] += (Math.random() * 2 - 1) * mutationRate
			}
		}
		// Mutar splines
		for (let i = 0; i < this.#numFunctions; i++) {
			for (let j = 0; j < this.#outputDim; j++) {
				this.splines[i][j].mutate(mutationRate)
			}
		}
	}

	// Método para clonar la red (se utiliza en el algoritmo NEAT para reproducir redes)
	clone(): KANNetwork {
		const clone = new KANNetwork(this.#inputDim, this.#numFunctions, this.#outputDim)
		clone.coefficients = structuredClone(this.coefficients)
		clone.splines = this.splines.map((row) => row.map((spline) => new Spline([...spline.controlPoints])))
		return clone
	}
}
