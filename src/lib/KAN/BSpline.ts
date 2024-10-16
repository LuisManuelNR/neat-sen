import { clamp, linspace, randomGaussian } from '$lib/utils'

export class BSpline {
	points: number[]
	#degree: number
	extended: number[]

	constructor(points: number[] | number, degree = 3) {
		this.#degree = degree

		if (typeof points === 'number') {
			this.points = linspace([-1, 1], points)
		} else {
			this.points = [...points]
		}

		this.extended = this.#extendGrid(this.points, this.#degree - 1)

		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	#extendGrid(grid: number[], k: number): number[] {
		const nIntervals = grid.length - 1
		const bucketSize = (grid[grid.length - 1] - grid[0]) / nIntervals
		let extendedGrid = [...grid]

		for (let i = 0; i < k; i++) {
			extendedGrid = [extendedGrid[0] - bucketSize, ...extendedGrid]
			extendedGrid = [...extendedGrid, extendedGrid[extendedGrid.length - 1] + bucketSize]
		}
		return extendedGrid
	}

	basis(xEval: number[], grid: number[]): number[][] {
		// Extiende el grid de nudos
		const knots = this.extended
		const numBases = knots.length - this.#degree - 1

		// Inicializa las funciones base para el caso base de orden 0
		let bases: number[][] = Array(numBases).fill(null).map(() => Array(xEval.length).fill(0))
		for (let i = 0; i < numBases; i++) {
			for (let j = 0; j < xEval.length; j++) {
				const t = xEval[j]
				bases[i][j] = t >= knots[i] && t < knots[i + 1] ? 1.0 : 0.0
			}
		}

		// Calcula las funciones base para el grado especificado `this.#degree`
		for (let k = 1; k <= this.#degree; k++) {
			const newBases: number[][] = Array(numBases).fill(null).map(() => Array(xEval.length).fill(0))
			for (let i = 0; i < numBases - k; i++) {
				for (let j = 0; j < xEval.length; j++) {
					const t = xEval[j]
					const denom1 = knots[i + k] - knots[i]
					const denom2 = knots[i + k + 1] - knots[i + 1]

					// Evita divisiones por cero usando una pequeña constante en el denominador
					const adjustedDenom1 = denom1 === 0 ? 1e-10 : denom1
					const adjustedDenom2 = denom2 === 0 ? 1e-10 : denom2

					const term1 = ((t - knots[i]) / adjustedDenom1) * bases[i][j]
					const term2 = ((knots[i + k + 1] - t) / adjustedDenom2) * bases[i + 1][j]

					newBases[i][j] = term1 + term2
				}
			}
			bases = newBases
		}
		return bases
	}


	evaluate(x: number): number {
		const basisAtX = this.basis([x], this.points).map(basis => basis[0])
		return basisAtX.reduce((sum, basisValue, i) => sum + this.points[i] * basisValue, 0)
	}

	mutate() {
		this.points = this.points.map(c => {
			c += randomGaussian(0, 0.01)
			return clamp(c, -1, 1)
		})
	}

	clone() {
		return new BSpline(this.points, this.#degree)
	}
}
