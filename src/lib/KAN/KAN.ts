import { randomNumber } from '@chasi/ui/utils'
import { Vec2D } from '../utils'

export class Brain {
	inputDim: number
	outputDim: number
	numFunctions: number
	coefficients: number[][] // Coeficientes para las combinaciones lineales
	splines: Spline[][] // Splines en los bordes

	constructor(inputDim: number, outputDim: number) {
		this.inputDim = inputDim
		this.numFunctions = 10
		this.outputDim = outputDim

		// Inicializar coeficientes de combinaciones lineales
		this.coefficients = this.#initializeCoefficients()
		// Inicializar splines
		this.splines = this.#initializeSplines()
	}

	#initializeCoefficients(): number[][] {
		const coefficients: number[][] = []
		for (let i = 0; i < this.numFunctions; i++) {
			const funcCoefficients: number[] = []
			for (let j = 0; j < this.inputDim; j++) {
				// Normalizar coeficientes en el rango [-1, 1]
				funcCoefficients.push(Math.random() * 2 - 1)
			}
			coefficients.push(funcCoefficients)
		}
		return coefficients
	}

	#initializeSplines(): Spline[][] {
		const splinesArray: Spline[][] = []
		for (let i = 0; i < this.numFunctions; i++) {
			const splineFunctions: Spline[] = []
			for (let j = 0; j < this.outputDim; j++) {
				// Inicializar puntos de control con valores y pequeños para evitar valores grandes en las splines
				const points = [
					new Vec2D(0, randomNumber(-1, 1)),
					new Vec2D(1, randomNumber(-1, 1)),
					new Vec2D(2, randomNumber(-1, 1))
				]
				splineFunctions.push(new Spline(points))
			}
			splinesArray.push(splineFunctions)
		}
		return splinesArray
	}

	forward(input: number[]): number[] {
		const outputs: number[] = new Array(this.outputDim).fill(0)

		for (let outIdx = 0; outIdx < this.outputDim; outIdx++) {
			let sum = 0
			for (let funcIdx = 0; funcIdx < this.numFunctions; funcIdx++) {
				const linearResult = this.#linearCombination(input, this.coefficients[funcIdx])
				const splineResult = this.splines[funcIdx][outIdx].evaluate(linearResult)
				sum += splineResult
			}

			// Aplicar función de activación (tanh) para forzar el resultado a estar entre -1 y 1
			outputs[outIdx] = Math.tanh(sum)
		}

		return outputs
	}

	#linearCombination(input: number[], coefficients: number[]): number {
		return input.reduce((sum, val, i) => sum + val * coefficients[i], 0)
	}

	mutate(mutationRate: number): void {
		// Mutar coeficientes lineales
		for (let i = 0; i < this.numFunctions; i++) {
			for (let j = 0; j < this.inputDim; j++) {
				this.coefficients[i][j] += randomNumber(-0.1, 0.1) * mutationRate
			}
		}
		// Mutar splines
		for (let i = 0; i < this.numFunctions; i++) {
			for (let j = 0; j < this.outputDim; j++) {
				this.splines[i][j].mutate(mutationRate)
			}
		}
	}

	clone(): Brain {
		const clone = new Brain(this.inputDim, this.outputDim)
		clone.coefficients = structuredClone(this.coefficients)
		clone.splines = this.splines.map((row) => row.map((spline) => spline.clone()))
		return clone
	}

	crossover(partner: Brain): Brain {
		const childNetwork = this.clone()

		for (let i = 0; i < this.coefficients.length; i++) {
			for (let j = 0; j < this.coefficients[i].length; j++) {
				childNetwork.coefficients[i][j] =
					Math.random() > 0.5 ? this.coefficients[i][j] : partner.coefficients[i][j]
			}
		}

		for (let i = 0; i < this.splines.length; i++) {
			for (let j = 0; j < this.splines[i].length; j++) {
				childNetwork.splines[i][j] =
					Math.random() > 0.5
						? new Spline([...this.splines[i][j].controlPoints])
						: new Spline([...partner.splines[i][j].controlPoints])
			}
		}

		return childNetwork
	}
}

export class Spline {
	controlPoints: Vec2D[]

	constructor(controlPoints: Vec2D[]) {
		this.controlPoints = controlPoints
	}

	evaluate(x: number): number {
		if (this.controlPoints.length < 4) {
			return this.linearInterpolate(x)
		}

		let i = 1
		while (i < this.controlPoints.length - 2 && x > this.controlPoints[i + 1].x) {
			i++
		}

		const p0 = this.controlPoints[i - 1]
		const p1 = this.controlPoints[i]
		const p2 = this.controlPoints[i + 1]
		const p3 = this.controlPoints[i + 2]

		const t = (x - p1.x) / (p2.x - p1.x)

		const a = -0.5 * p0.y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3.y
		const b = p0.y - 2.5 * p1.y + 2 * p2.y - 0.5 * p3.y
		const c = -0.5 * p0.y + 0.5 * p2.y
		const d = p1.y

		return a * t * t * t + b * t * t + c * t + d
	}

	linearInterpolate(x: number): number {
		const n = this.controlPoints.length
		for (let i = 0; i < n - 1; i++) {
			const p0 = this.controlPoints[i]
			const p1 = this.controlPoints[i + 1]
			if (x >= p0.x && x <= p1.x) {
				const t = (x - p0.x) / (p1.x - p0.x)
				return p0.y + t * (p1.y - p0.y)
			}
		}
		return this.controlPoints[n - 1].y
	}

	mutate(mutationRate: number): void {
		this.controlPoints = this.controlPoints.map(
			(point) =>
				new Vec2D(
					point.x + randomNumber(-0.1, 0.1) * mutationRate,
					point.y + randomNumber(-0.1, 0.1) * mutationRate
				)
		)
	}

	clone() {
		return new Spline(structuredClone(this.controlPoints))
	}
}
