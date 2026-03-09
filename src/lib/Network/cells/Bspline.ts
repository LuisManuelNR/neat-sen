import type { Cell } from '../Brain'
import { randomGaussian } from '$lib/utils'

const POINTS = 8
const DEGREE = 3
const KNOTS = Array.from({ length: POINTS + DEGREE + 1 }, (_, i) => i)

export class BSpline implements Cell {
	value = 0
	points: number[] = Array(POINTS).fill(Math.random())

	evaluate(x: number) {
		// Remap `x` al dominio donde está definida la spline
		const domain = [DEGREE, KNOTS.length - DEGREE - 1]
		const low = KNOTS[domain[0]]
		const high = KNOTS[domain[1]]
		x = x * (high - low) + low

		if (x < low) x = low
		if (x > high) x = high

		// if (x < low || x > high) throw new Error(`x is out of bounds, x=${x}, [${low}, ${high}]`)

		// Evaluar el valor usando las funciones base
		this.value = this.points.reduce((sum, p, i) => sum + p * basisFunction(i, DEGREE, x), 0)
	}
	mutate() {
		this.points = this.points.map((c) => {
			if (Math.random() > 0.5) {
				c += randomGaussian(0, 0.1)
			}
			return c
		})
	}
}

function basisFunction(i: number, degree: number, x: number): number {
	if (degree === 0) {
		// Caso base: grado 0
		return KNOTS[i] <= x && x < KNOTS[i + 1] ? 1 : 0
	} else {
		const leftDenom = KNOTS[i + degree] - KNOTS[i]
		const left =
			leftDenom !== 0 ? ((x - KNOTS[i]) / leftDenom) * basisFunction(i, degree - 1, x) : 0

		const rightDenom = KNOTS[i + degree + 1] - KNOTS[i + 1]
		const right =
			rightDenom !== 0
				? ((KNOTS[i + degree + 1] - x) / rightDenom) * basisFunction(i + 1, degree - 1, x)
				: 0

		return left + right
	}
}
