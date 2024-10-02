import { isInside, randomNumber } from '@chasi/ui/utils'

export function range(range: [number, number], N: number): number[] {
	const [min, max] = range
	const result: number[] = []
	const step = (max - min) / (N - 1) // Calcular el tamaño del paso

	for (let i = 0; i < N; i++) {
		result.push(min + i * step) // Añadir valores espaciados uniformemente
	}

	return result
}

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
	set x(value: number) {
		this.values[0] = value
	}
	set y(value: number) {
		this.values[1] = value
	}

	degFromPoint(point: Vec2D) {
		const deltaX = point.x - this.x
		const deltaY = point.y - this.y
		const rad = Math.atan2(deltaY, deltaX)
		return rad * (180 / Math.PI)
	}
	distanceTo(point: Vec2D): number {
		const deltaX = point.x - this.x
		const deltaY = point.y - this.y
		return Math.hypot(deltaX, deltaY)
	}
}

export function randomGaussian(mean: number, stdDev: number): number {
	let u1 = Math.random()
	let u2 = Math.random()
	let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
	return z0 * stdDev + mean
}

export function randomIndex(arr: Array<any>) {
	return randomNumber(0, arr.length)
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

export function sigmoid(x: number) {
	return 1 / (1 + Math.exp(-x))
}
