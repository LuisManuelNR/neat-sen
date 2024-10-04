import { probably, randomGaussian } from '$lib/utils'

export class BSpline {
	controlPoints: number[]
	#degree: number
	#knots: number[]

	constructor(points = 4) {
		this.#degree = points - 1
		this.controlPoints = Array.from({ length: points }, () => Math.random())
		this.#knots = this.#generateKnotVector()
		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	// Método para evaluar la curva en un valor t (entre 0 y 1)
	evaluate(t: number): number {
		if (t > 1 || t < 0) {
			throw new Error(`Expected t in range [0, 1], recived: ${t}`)
		}
		return this.#deBoor(this.#degree, t)
	}

	#deBoor(degree: number, x: number): number {
		const n = this.controlPoints.length - 1
		let d = [...this.controlPoints] // Copia de los puntos de control

		// Algoritmo de De Boor
		for (let r = 1; r <= degree; r++) {
			for (let i = n; i >= r; i--) {
				const alpha = (x - this.#knots[i]) / (this.#knots[i + degree + 1 - r] - this.#knots[i])
				d[i] = (1 - alpha) * d[i - 1] + alpha * d[i]
			}
		}

		return d[n]
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

	mutate() {
		const step = 0.1
		this.controlPoints = this.controlPoints.map((n) => {
			if (probably(0.3)) {
				n += randomGaussian(0, step)
				if (n > 1) n -= step
				if (n < 0) n += step
			}
			return n
		})
		this.#knots = this.#generateKnotVector()
	}

	clone() {
		const clone = new BSpline(this.controlPoints.length)
		clone.controlPoints = this.controlPoints
		return clone
	}
}
