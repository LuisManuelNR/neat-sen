import { isInside } from '@chasi/ui/utils'

export function createBoundPoints(points: number, origin: Vec2D, radius: number) {
	const step = 360 / points // División equitativa de los ángulos
	const bound: Vec2D[] = []

	for (let i = 0; i < points; i++) {
		const angle = step * i // Ángulo en grados
		const radians = angle * (Math.PI / 180) // Convertimos a radianes

		// Calculamos la posición de cada punto usando trigonometría
		const x = origin.x + radius * Math.cos(radians)
		const y = origin.y + radius * Math.sin(radians)

		bound.push(new Vec2D(x, y))
	}

	return bound
}

export function isInsidePoly(source: Vec2D[], target: Vec2D[]) {
	const _t = target.map((v) => v.values)
	for (let i = 0; i < source.length; i++) {
		const vertice = source[i]
		if (isInside([vertice.x, vertice.y], _t)) return true
	}
	return false
}

export function normalize(value: number, min: number, max: number): number {
	return (value - min) / (max - min)
}

export function denormalize(normalizedValue: number, min: number, max: number): number {
	return normalizedValue * (max - min) + min
}

export class Vec2D {
	values: [number, number]
	constructor(x: number, y: number) {
		this.values = [x, y]
	}
	get x() {
		return this.values[0]
	}
	get y() {
		return this.values[1]
	}
}
