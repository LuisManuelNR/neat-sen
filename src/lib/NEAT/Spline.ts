import { Vec2D } from '../utils'

export class Spline {
	controlPoints: Vec2D[]

	constructor(controlPoints: Vec2D[]) {
		this.controlPoints = controlPoints
	}

	// Evaluar el spline en un punto x
	evaluate(x: number): number {
		// Método básico de interpolación lineal para el spline
		const n = this.controlPoints.length
		for (let i = 0; i < n - 1; i++) {
			const p0 = this.controlPoints[i]
			const p1 = this.controlPoints[i + 1]
			if (x >= p0.x && x <= p1.x) {
				const t = (x - p0.x) / (p1.x - p0.x)
				return p0.y + t * (p1.y - p0.y) // Interpolación lineal
			}
		}
		return this.controlPoints[n - 1].y // Fuera del rango, retorna el último valor
	}

	// Mutar los puntos de control para evolucionar el spline
	mutate(mutationRate: number): void {
		this.controlPoints = this.controlPoints.map(
			(point) => new Vec2D(point.x, point.y + (Math.random() * 2 - 1) * mutationRate)
		)
	}
}
