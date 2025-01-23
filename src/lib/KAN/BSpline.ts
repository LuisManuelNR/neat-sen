import { clamp, linspace, randomGaussian } from '$lib/utils'

export class BSpline {
	points: number[]
	#extendedPoints: number[]
	degree

	constructor(points: number[] | number, degree = 3) {
		this.points = Array.isArray(points)
			? points
			: Array(points)
				.fill(0)
				.map(() => Math.random())

		this.degree = degree
		this.#extendedPoints = this.#extendGrid(this.points, this.degree)
		console.log(this.points)
		console.log(this.#extendedPoints)
	}

	plot(resolution = 100) {
		const x = linspace([this.points[0], this.points.at(-1)!], resolution)
		const y = x.map((v) => this.evaluate(v))
		return { x, y }
	}

	evaluate(x: number): number {
		return this.basisFunction(x, this.#extendedPoints, this.degree)
	}

	private basisFunction(x: number, grid: number[], degree: number): number {
		if (degree === 0) {
			// Base case: step function
			for (let i = 0; i < grid.length - 1; i++) {
				if (x >= grid[i] && x < grid[i + 1]) return 1
			}
			return 0
		}

		// Recursive case
		let result = 0
		for (let i = 0; i < grid.length - degree - 1; i++) {
			const denom1 = grid[i + degree] - grid[i]
			const denom2 = grid[i + degree + 1] - grid[i + 1]

			const coeff1 = denom1 > 0 ? (x - grid[i]) / denom1 : 0
			const coeff2 = denom2 > 0 ? (grid[i + degree + 1] - x) / denom2 : 0

			result += coeff1 * this.basisFunction(x, grid.slice(i, i + degree + 1), degree - 1)
			result += coeff2 * this.basisFunction(x, grid.slice(i + 1, i + degree + 2), degree - 1)
		}
		return result
	}

	#extendGrid(grid: number[], degree: number): number[] {
		const bucketSize = (grid.at(-1)! - grid[0]) / (grid.length - 1)
		for (let i = 0; i < degree; i++) {
			grid = [grid[0] - bucketSize, ...grid, grid.at(-1)! + bucketSize]
		}
		return grid
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
