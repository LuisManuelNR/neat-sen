import { clamp, linspace, randomGaussian } from '$lib/utils'

export class BSpline {
	points: number[]
	knots: number[]
	degree

	constructor(points: number[] | number, degree = 2) {
		this.points = Array.isArray(points)
			? points
			: Array(points)
					.fill(0)
					.map(() => Math.random())

		this.degree = degree
		this.knots = Array.from({ length: this.points.length + degree + 1 }, (_, i) => i)
	}

	plot(resolution = 100) {
		const x = linspace(this.points[0], this.points.at(-1)!, resolution)
		const y = x.map((v) => this.evaluate(v))
		return { x, y }
	}

	evaluate(x: number): number {
		const degree = this.degree
		const knots = this.knots

		// Remap `x` to the domain where the spline is defined
		const domain = [degree, knots.length - degree - 1]
		const low = knots[domain[0]]
		const high = knots[domain[1]]
		x = x * (high - low) + low

		if (x < low || x > high) throw new Error(`x is out of bounds, x=${x}, [${low}, ${high}]`)

		// Find the segment `s` for the `x` value
		let s = domain[0]
		for (; s < domain[1]; s++) {
			if (x >= knots[s] && x <= knots[s + 1]) {
				break
			}
		}

		// Convert points to "homogeneous coordinates" (in this case, weights are 1)
		let v = this.points.map((p) => [p, 1])

		// Perform De Boor's algorithm
		for (let l = 1; l <= degree + 1; l++) {
			for (let i = s; i > s - degree - 1 + l; i--) {
				const alpha = (x - knots[i]) / (knots[i + degree + 1 - l] - knots[i])
				v[i][0] = (1 - alpha) * v[i - 1][0] + alpha * v[i][0] // Interpolate value
				v[i][1] = (1 - alpha) * v[i - 1][1] + alpha * v[i][1] // Interpolate weight
			}
		}

		// Convert back to Cartesian by dividing by the weight
		return v[s][0] / v[s][1]
	}

	// Mutación de los puntos de control
	mutate() {
		this.points = this.points.map((c) => {
			if (Math.random() > 0.1) {
				c += randomGaussian(0, 0.01)
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
