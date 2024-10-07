import { clamp, probably, randomGaussian } from '$lib/utils'

export class BSpline {
	controlPoints: number[]
	#degree: number
	#knots: number[]

	constructor(points = 4) {
		this.#degree = points + 2
		this.controlPoints = Array.from({ length: points }, () => Math.random())
		this.#knots = this.#generateKnotVector()
		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	evaluate(t: number): number {
		if (t > 1 || t < 0) {
			throw new Error(`Expected t in range [0, 1], received: ${t}`)
		}
		return this.#deBoor(this.#degree, t)
	}

	#deBoor(degree: number, x: number): number {
		const n = this.controlPoints.length - 1
		let d = [...this.controlPoints]

		for (let r = 1; r <= degree; r++) {
			for (let i = n; i >= r; i--) {
				const denominator = this.#knots[i + degree + 1 - r] - this.#knots[i] || 1e-10
				const alpha = (x - this.#knots[i]) / denominator
				d[i] = (1 - alpha) * d[i - 1] + alpha * d[i]
			}
		}
		return d[n]
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

		if (probably(0.1) && this.controlPoints.length < 7) {
			this.controlPoints.push(Math.random())
			this.#degree = this.controlPoints.length + 1
			this.#knots = this.#generateKnotVector()
		}
	}

	clone() {
		const clone = new BSpline(this.controlPoints.length)
		clone.controlPoints = Array.from(this.controlPoints)
		return clone
	}
}
