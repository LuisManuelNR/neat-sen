import { clamp, randomGaussian } from '$lib/utils'

// BSpline para ser usada en una red Kolmogorov-Arnold Networks
export class BSpline {
	coeficients: number[]
	degree: number
	knots: number[]
	basisFunctions: Array<(x: number) => number>

	constructor(coeficients: number[] | number, degree = 3) {
		// Si coeficients es un número, genera un array de coeficientes aleatorios
		this.coeficients = Array.isArray(coeficients)
			? coeficients
			: Array(coeficients)
					.fill(0)
					.map(() => Math.random())
		this.degree = degree
		this.knots = this.generateUniformKnots(this.coeficients.length, degree)
		this.basisFunctions = this.generateBasisFunctions()

		this.evaluate = this.evaluate.bind(this)
		this.plotBasis = this.plotBasis.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	// Generación de los nudos de forma uniforme
	generateUniformKnots(numCoefs: number, degree: number): number[] {
		const n = numCoefs + degree + 1
		return Array.from({ length: n }, (_, i) => i / (n - 1))
	}

	// Generación de las funciones base utilizando la recursión de De Boor-Cox
	generateBasisFunctions(): Array<(x: number) => number> {
		const N = (i: number, k: number, t: number) => {
			if (k === 0) {
				return this.knots[i] <= t && t < this.knots[i + 1] ? 1 : 0
			} else {
				const left: number =
					((t - this.knots[i]) / (this.knots[i + k] - this.knots[i])) * N(i, k - 1, t)
				const right: number =
					((this.knots[i + k + 1] - t) / (this.knots[i + k + 1] - this.knots[i + 1])) *
					N(i + 1, k - 1, t)
				return (left || 0) + (right || 0)
			}
		}
		return this.coeficients.map((_, i) => (x: number) => N(i, this.degree, x))
	}

	// Evaluar la B-Spline en un punto x
	evaluate(x: number): number {
		// for (let k = this.degree; k < this.knots.length - this.degree - 1; k++) {
		// 	const bFn = this.basisFunctions[k - ]
		// }
		return this.coeficients.reduce((sum, coef, i) => sum + coef * this.basisFunctions[i](x), 0)
	}

	// Visualización de las funciones base (resolution = cuántas x vamos a evaluar contra la función)
	plotBasis(resolution = 100): number[][] {
		const xValues = Array.from({ length: resolution }, (_, i) => i / (resolution - 1))
		return this.basisFunctions.map((basisFunc) => xValues.map((x) => basisFunc(x)))
	}

	// Mutación de los puntos de control (pequeño cambio aleatorio en coeficientes)
	mutate() {
		const mutationStrength = 0.05
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
