import { clamp, linspace, randomGaussian } from '$lib/utils'

export class BSpline {
	points: number[]
	degree

	constructor(points: number[] | number, degree = 1) {
		this.points = Array.isArray(points)
			? points
			: Array(points)
					.fill(0)
					.map(() => Math.random())

		this.degree = degree
	}

	plot(resolution = 100) {
		const x = linspace([0, 1], resolution)
		const y = x.map((v) => this.evaluate(v))
		return { x, y }
	}

	evaluate(x: number): number {
		const n = this.points.length - 1
		const index = Math.min(Math.floor(x * n), n - 1)
		const t = x * n - index

		// Evaluación basada en el grado de la spline.
		switch (this.degree) {
			case 1: // Spline lineal
				return this.linearInterpolation(index, t)
			case 2: // Spline cuadrática
				return this.quadraticInterpolation(index, t)
			case 3: // Spline cúbica
				return this.cubicInterpolation(index, t)
			default:
				throw new Error(`Spline degree ${this.degree} not supported.`)
		}
	}

	private linearInterpolation(index: number, t: number): number {
		const y1 = this.points[index]
		const y2 = this.points[index + 1]
		return (1 - t) * y1 + t * y2
	}

	private quadraticInterpolation(index: number, t: number): number {
		const p0 = this.points[Math.max(0, index - 1)]
		const p1 = this.points[index]
		const p2 = this.points[Math.min(this.points.length - 1, index + 1)]
		return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2
	}

	private cubicInterpolation(index: number, t: number): number {
		const p0 = this.points[Math.max(0, index - 1)]
		const p1 = this.points[index]
		const p2 = this.points[Math.min(this.points.length - 1, index + 1)]
		const p3 = this.points[Math.min(this.points.length - 1, index + 2)]
		return (
			(-0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3) * t * t * t +
			(p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3) * t * t +
			(-0.5 * p0 + 0.5 * p2) * t +
			p1
		)
	}

	// Mutación de los puntos de control
	mutate(): void {
		this.points = this.points.map((c) => {
			if (Math.random() > 0.1) {
				c += randomGaussian(0, 0.1)
				c = clamp(c, 0, 1)
			} else if (Math.random() < 0.03) {
				c = Math.random()
			}
			return c
		})
	}

	// Clonación de la spline
	clone(): BSpline {
		return new BSpline([...this.points])
	}
}
