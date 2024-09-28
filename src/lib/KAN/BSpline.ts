import { randomNumber } from '@chasi/ui/utils'

export class BSpline {
	controlPoints: [number, number][] = []
	#degree: number
	#knots: number[] = []

	constructor(controlPoints?: [number, number][], degree?: number) {
		this.#degree = degree || 3
		this.controlPoints = controlPoints || [
			[-1, randomNumber(-1, 1)],
			[-0.5, randomNumber(-1, 1)],
			[0, randomNumber(-1, 1)],
			[0.5, randomNumber(-1, 1)],
			[1, randomNumber(-1, 1)]
		]
		this.#knots = this.#generateKnotVector()
	}

	// Método que calcula el valor de la función B-Spline para una x dada
	evaluate(x: number): number {
		// Mapeo de x al rango [0, 1]
		const t = this.#mapXtoT(x)

		// Calcular el valor de y usando la fórmula de los B-Splines
		let y = 0
		for (let i = 0; i < this.controlPoints.length; i++) {
			const basis = this.#basisFunction(i, this.#degree, t)
			y += basis * this.controlPoints[i][1] // y es el segundo valor en el array [x, y]
		}
		return y
	}

	// Método privado para generar el vector de nodos (knots)
	#generateKnotVector(): number[] {
		const n = this.controlPoints.length - 1
		const m = n + this.#degree + 1
		let knots: number[] = []

		// Generar nodos uniformes abiertos
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

	// Método privado para mapear el valor de x al rango de los nodos [0, 1]
	#mapXtoT(x: number): number {
		const minX = this.controlPoints[0][0] // x es el primer valor en el array [x, y]
		const maxX = this.controlPoints[this.controlPoints.length - 1][0]
		return (x - minX) / (maxX - minX)
	}

	// Definición recursiva de la base B-Spline (método privado)
	#basisFunction(i: number, k: number, t: number): number {
		if (k === 0) {
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
}
