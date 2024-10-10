import { clamp, probably, randomGaussian } from '$lib/utils'

export class BSpline {
	controlPoints: number[]
	#degree: number
	#knots: number[]

	constructor(points = 4) {
		this.#degree = 3
		this.controlPoints = Array.from({ length: points }, () => Math.random())
		this.#knots = this.#generateKnotVector()
		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	evaluate(t: number): number {
		const n = this.controlPoints.length - 1
		let result = 0

		// Sumatoria de la combinación ponderada de los puntos de control
		for (let i = 0; i <= n; i++) {
			const basis = this.basisFN(i, this.#degree, t, this.#knots)
			result += this.controlPoints[i] * basis
		}

		return result
	}

	basisFN(i: number, r: number, t: number, u: number[]): number {
		const u_i = u[i]
		const u_i1 = u[i + 1]
		const u_ir = u[i + r]
		const u_i1r = u[i + r + 1]

		if (r === 0) {
			if (u_i <= t && t <= u_i1) {
				return 1
			} else {
				return 0
			}
		} else {
			let left = 0
			if (u_ir - u_i !== 0) {
				left = ((t - u_i) / (u_ir - u_i)) * this.basisFN(i, r - 1, t, u)
			}
			let right = 0
			if (u_i1r - u_i1 !== 0) {
				right = ((u_i1r - t) / (u_i1r - u_i1)) * this.basisFN(i + 1, r - 1, t, u)
			}
			return left + right
		}
	}

	#generateKnotVector(): number[] {
		const n = this.controlPoints.length - 1
		const m = n + this.#degree + 1
		const knots: number[] = []

		// Los primeros y últimos degree + 1 nudos son iguales para curva abierta
		for (let i = 0; i <= m; i++) {
			if (i < this.#degree) {
				knots.push(0)
			} else if (i > m - this.#degree) {
				knots.push(1)
			} else {
				knots.push((i - this.#degree) / (m - 2 * this.#degree))
			}
		}

		return knots
	}

	mutate() {
		this.controlPoints = this.controlPoints.map((n) => {
			n += randomGaussian(0, 0.05)
			return clamp(n, 0, 1)
		})
	}

	clone() {
		const clone = new BSpline(this.controlPoints.length)
		clone.controlPoints = Array.from(this.controlPoints)
		return clone
	}
}
