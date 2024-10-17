import { clamp, randomGaussian } from '$lib/utils'

// BSpline para ser usada en una red Kolmogorov-Arnold Networks
export class BSpline {
	coeficients: number[]
	degree: number
	knots: number[]
	extendedKnots: number[]

	constructor(coeficients: number[] | number, degree = 3) {
		this.coeficients = Array.isArray(coeficients)
			? coeficients
			: Array(coeficients)
					.fill(0)
					.map(() => Math.random())
		this.degree = degree
		this.knots = this.generateUniformKnots(this.coeficients.length, degree)
		this.extendedKnots = this.extendKnots(this.knots, degree) // Extensión del dominio

		this.evaluate = this.evaluate.bind(this)
		this.plotBasis = this.plotBasis.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	// Extiende la cuadrícula de nudos (equivalente a extend_grid en Python)
	extendKnots(knots: number[], degree: number): number[] {
		const n_intervals = knots.length - 1
		const bucket_size = (knots[knots.length - 1] - knots[0]) / n_intervals
		let extendedKnots = [...knots]

		for (let i = 0; i < degree; i++) {
			const leftValue = extendedKnots[0] - bucket_size
			extendedKnots.unshift(leftValue)
			const rightValue = extendedKnots[extendedKnots.length - 1] + bucket_size
			extendedKnots.push(rightValue)
		}

		return extendedKnots
	}

	// Evaluar las funciones base en un punto x utilizando la recursión de De Boor-Cox
	evaluateBasisFunction(i: number, k: number, x: number): number {
		if (k === 0) {
			return this.extendedKnots[i] <= x && x < this.extendedKnots[i + 1] ? 1 : 0
		} else {
			const left =
				((x - this.extendedKnots[i]) / (this.extendedKnots[i + k] - this.extendedKnots[i])) *
				this.evaluateBasisFunction(i, k - 1, x)
			const right =
				((this.extendedKnots[i + k + 1] - x) /
					(this.extendedKnots[i + k + 1] - this.extendedKnots[i + 1])) *
				this.evaluateBasisFunction(i + 1, k - 1, x)
			return (left || 0) + (right || 0)
		}
	}

	// Generación de los nudos de forma uniforme
	generateUniformKnots(numCoefs: number, degree: number): number[] {
		const n = numCoefs - degree - 1
		return Array.from({ length: n }, (_, i) => i / (n - 1))
	}

	// Evaluar la B-Spline en un punto x
	evaluate(x: number): number {
		return this.coeficients.reduce(
			(sum, coef, i) => sum + coef * this.evaluateBasisFunction(i, this.degree, x),
			0
		)
	}

	// Visualización de las funciones base (resolution = cuántas x vamos a evaluar contra la función)
	plotBasis(resolution = 100): number[][] {
		const xValues = Array.from({ length: resolution }, (_, i) => i / (resolution - 1))
		return this.extendedKnots.map((_, i) =>
			xValues.map((x) => this.evaluateBasisFunction(i, this.degree, x))
		)
	}

	// Método para graficar la B-Spline completa en un intervalo determinado
	plotSpline(resolution = 100) {
		const xValues = Array.from({ length: resolution }, (_, i) => i / (resolution - 1))
		const yValues = xValues.map((x) => this.evaluate(x))
		return [xValues, yValues]
	}

	// Mutación de los puntos de control (pequeño cambio aleatorio en coeficientes)
	mutate() {
		const mutationStrength = 0.01
		this.coeficients = this.coeficients.map((c) => {
			c += randomGaussian(0, mutationStrength)
			return clamp(c, 0, 1)
		})
	}

	// Clonación de la spline
	clone(): BSpline {
		return new BSpline([...this.coeficients], this.degree)
	}
}
