import { clamp, randomGaussian } from '$lib/utils'

export class BSpline {
	points: number[]
	private knots: number[]
	private degree

	constructor(points: number[] | number, degree = 3) {
		this.points = Array.isArray(points)
			? points
			: Array(points).fill(0).map(() => Math.random())


		this.degree = degree
		this.points = this.extendControlPoints(this.points, this.degree)
		this.knots = this.generateKnots()
		// this.knots = this.extendKnots(this.knots, this.degree)
		this.evaluate = this.evaluate.bind(this)
		this.mutate = this.mutate.bind(this)
		this.clone = this.clone.bind(this)
	}

	extendKnots(knots: number[], degree: number): number[] {
		const bucket_size = knots[1] - knots[0] // Tamaño entre nudos consecutivos
		const leftExtended = Array.from(
			{ length: degree },
			(_, i) => knots[0] - (i + 1) * bucket_size
		).reverse()
		const rightExtended = Array.from(
			{ length: degree },
			(_, i) => knots[knots.length - 1] + (i + 1) * bucket_size
		)
		return [...leftExtended, ...knots, ...rightExtended]
	}

	// Genera un vector de nudos uniforme
	private generateKnots(): number[] {
		const n = this.points.length + this.degree + 1
		return Array.from({ length: n }, (_, i) => i / (n - 1))
	}

	private extendControlPoints(points: number[], degree: number): number[] {
		const leftExtension = Array(degree).fill(points[0]) // Repetir el primer punto
		const rightExtension = Array(degree).fill(points[points.length - 1]) // Repetir el último punto
		return [...leftExtension, ...points, ...rightExtension]
	}

	// Evaluar u en la B-Spline usando el algoritmo de De Boor
	evaluate(u: number): number {
		const knots = this.knots

		if (u < 0 || u > 1) {
			throw new Error('El parámetro u debe estar entre 0 y 1.')
		}

		// Mapear u al dominio de los nudos
		const low = knots[this.degree]
		const high = knots[knots.length - this.degree - 1]
		const uMapped = u * (high - low) + low

		// Encontrar el segmento de los nudos
		let k = this.degree
		while (k < knots.length - 1 && !(uMapped >= knots[k] && uMapped < knots[k + 1])) {
			k++
		}

		// Inicializar los puntos de control relevantes
		let d = this.points.slice(k - this.degree, k + 1)

		// Aplicar el algoritmo de De Boor
		for (let r = 1; r <= this.degree; r++) {
			for (let j = this.degree; j >= r; j--) {
				const alpha = (uMapped - knots[k + j - this.degree]) /
					(knots[k + j - r + 1] - knots[k + j - this.degree])
				d[j] = (1 - alpha) * d[j - 1] + alpha * d[j]
			}
		}

		return d[this.degree]
	}

	// Mutación de los puntos de control
	mutate() {
		this.points = this.points.map((c) => {
			if (Math.random() > 0.1) {
				c += randomGaussian(0, 0.01)
				c = clamp(c, 0, 1) // Asegurarse de que los valores mutados están en el rango
			} else if (Math.random() < 0.03) {
				c = Math.random() // Asume que Math.random() está en [0,1]
			}
			return c
		})
	}

	// Clonación de la spline
	clone(): BSpline {
		return new BSpline([...this.points])
	}
}
