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
		const x = linspace(0, 1, resolution)
		const y = x.map((v) => this.evaluate(v))
		return { x, y }
	}

	// Evaluar el B-Spline usando las funciones base
	evaluate(x: number): number {
		const degree = this.degree
		const knots = this.knots

		// Remap `x` al dominio donde está definida la spline
		const domain = [degree, knots.length - degree - 1]
		const low = knots[domain[0]]
		const high = knots[domain[1]]
		x = x * (high - low) + low

		if (x < low || x > high) throw new Error(`x is out of bounds, x=${x}, [${low}, ${high}]`)

		// Evaluar el valor usando las funciones base
		return this.points.reduce((sum, p, i) => sum + p * this.basisFunction(i, degree, x), 0)
	}

	// Método para calcular las funciones base
	plotBasis(resolution = 100): number[][] {
		const basisFunctions: number[][] = []
		const x = linspace(
			this.knots[this.degree],
			this.knots[this.knots.length - this.degree - 1],
			resolution
		)

		// Calculamos cada función base
		for (let i = 0; i < this.points.length; i++) {
			const basis = x.map((xi) => this.basisFunction(i, this.degree, xi))
			basisFunctions.push(basis)
		}

		return basisFunctions
	}

	// Función recursiva para calcular las funciones base
	private basisFunction(i: number, degree: number, x: number): number {
		const knots = this.knots

		if (degree === 0) {
			// Caso base: grado 0
			return knots[i] <= x && x < knots[i + 1] ? 1 : 0
		} else {
			const leftDenom = knots[i + degree] - knots[i]
			const left =
				leftDenom !== 0 ? ((x - knots[i]) / leftDenom) * this.basisFunction(i, degree - 1, x) : 0

			const rightDenom = knots[i + degree + 1] - knots[i + 1]
			const right =
				rightDenom !== 0
					? ((knots[i + degree + 1] - x) / rightDenom) * this.basisFunction(i + 1, degree - 1, x)
					: 0

			return left + right
		}
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
