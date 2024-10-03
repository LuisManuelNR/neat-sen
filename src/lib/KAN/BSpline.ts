import { randomGaussian } from '$lib/utils'
import { randomNumber } from '@chasi/ui/utils'

export class BSpline {
	controlPoints: number[]
	#degree: number
	#knots: number[]

	constructor(points = 4, degree = 2) {
		this.#degree = degree
		this.controlPoints = Array.from({ length: points }, () => Math.random())
		this.#knots = this.#generateKnotVector()
	}

	// Método para evaluar la curva en un valor t (entre 0 y 1)
	evaluate(t: number): number {
		if (t < 0 || t > 1) {
			throw new Error(`El valor de t debe estar entre 0 y 1. recibido ${t}`)
		}

		let result = 0

		// Evaluar la función base para cada punto de control y sumar sus contribuciones
		for (let i = 0; i < this.controlPoints.length; i++) {
			const basis = this.#basisFunction(i, this.#degree, t)
			result += basis * this.controlPoints[i]
		}

		return result
	}

	#generateKnotVector(): number[] {
		const n = this.controlPoints.length - 1
		const m = n + this.#degree + 1
		const knots: number[] = []

		for (let i = 0; i <= m; i++) {
			if (i <= this.#degree) {
				knots.push(0)
			} else if (i >= m - this.#degree) {
				knots.push(1)
			} else {
				knots.push((i - this.#degree) / (m - 2 * this.#degree))
			}
		}

		return knots
	}

	// Definición recursiva de la base B-Spline
	#basisFunction(i: number, k: number, t: number): number {
		if (k === 0) {
			if (i === this.controlPoints.length - 1 && t === 1) {
				return 1
			}
			return this.#knots[i] <= t && t < this.#knots[i + 1] ? 1 : 0
		} else {
			const denom1 = this.#knots[i + k] - this.#knots[i]
			const denom2 = this.#knots[i + k + 1] - this.#knots[i + 1]

			const term1 =
				denom1 !== 0 ? ((t - this.#knots[i]) / denom1) * this.#basisFunction(i, k - 1, t) : 0
			const term2 =
				denom2 !== 0
					? ((this.#knots[i + k + 1] - t) / denom2) * this.#basisFunction(i + 1, k - 1, t)
					: 0

			return term1 + term2
		}
	}

	mutate() {
		this.controlPoints = this.controlPoints.map((n) => {
			n += randomGaussian(0, 0.1)
			if (n > 1) n -= 0.01
			if (n < 0) n += 0.01
			return n
		})
	}

	clone() {
		const clone = new BSpline(this.controlPoints.length, this.#degree)
		clone.controlPoints = this.controlPoints
		return clone
	}
}
