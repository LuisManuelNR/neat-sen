import { clamp, linspace, randomGaussian } from '$lib/utils'

// una b-spline C2 (continuidad 2)
export class BSpline {
	points: number[]
	mutationForce = 0.1

	constructor(points: number[] | number) {
		this.points = Array.isArray(points)
			? points
			: Array(points)
					.fill(0)
					.map(() => Math.random())

		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	// Evaluar u en la B-Spline usando la fórmula de De Boor
	evaluate(u: number): number {
		const n = this.points.length - 1
		const degree = 3 // para continuidad C2 en B-spline cúbica
		const maxIndex = n - degree + 1
		const k = Math.min(Math.floor(u * maxIndex), maxIndex - 1)
		const t = u * maxIndex - k
		let d = this.points.slice(k, k + degree + 1)

		for (let r = 1; r <= degree; r++) {
			for (let j = degree; j >= r; j--) {
				const alpha = (t - (j - r)) / (degree + 1 - r)
				d[j] = (1 - alpha) * d[j - 1] + alpha * d[j]
			}
		}
		return d[degree]
	}

	plotSpline(n = 100): number[][] {
		const x: number[] = linspace([0, 1], n)
		const y: number[] = x.map(this.evaluate)
		return [x, y]
	}

	fitCoefficients(targetFunction: (x: number) => number, numCoefficients: number = 10) {
		// Definimos puntos de control iniciales
		this.points = Array(numCoefficients)
			.fill(0)
			.map((_, i) => {
				const x = i / (numCoefficients - 1)
				return targetFunction(x)
			})

		// Ajuste de puntos de control para minimizar el error entre la B-Spline y la función objetivo
		const iterations = 1000
		const learningRate = 0.01

		for (let iter = 0; iter < iterations; iter++) {
			let totalError = 0

			for (let i = 0; i < numCoefficients; i++) {
				const x = i / (numCoefficients - 1)
				const u = x
				const error = targetFunction(x) - this.evaluate(u)
				this.points[i] += learningRate * error
				totalError += Math.abs(error)
			}

			// Terminar si el error es suficientemente pequeño
			if (totalError < 1e-6) break
		}
	}

	// Mutación de los puntos de control (pequeño cambio aleatorio en coeficientes)
	mutate() {
		if (this.mutationForce < 0) return
		this.points = this.points.map((c) => {
			c += randomGaussian(0, this.mutationForce)
			return clamp(c, 0, 1)
		})
		this.mutationForce -= 0.0001
	}

	// Clonación de la spline
	clone(): BSpline {
		return new BSpline([...this.points])
	}
}
