import { isInside, randomNumber } from '@chasi/ui/utils'

export function linspace(range: [number, number], N: number): number[] {
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
		if (isInside(vertice.values, _t)) return true
	}
	return false
}

export function normalize(value: number, min: number, max: number): number {
	return (value - min) / (max - min)
}

export function denormalize(normalizedValue: number, min: number, max: number): number {
	return normalizedValue * (max - min) + min
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

export function relu(x: number) {
	return Math.max(0, x)
}

export function silu(x: number) {
	return x * sigmoid(x)
}

export function runEveryFrames(fps = 30, callback: () => void) {
	const interval = 1000 / fps // Tiempo en ms entre cada frame
	let now
	let then = Date.now()
	let delta

	let timeoutId: number

	function update() {
		timeoutId = setTimeout(update, interval) // Llama a update en intervalos regulares

		now = Date.now()
		delta = now - then

		if (delta > interval) {
			then = now - (delta % interval)

			callback() // Ejecutar el callback
		}
	}

	update()

	// Retorna una función para cancelar la ejecución de frames
	return () => clearTimeout(timeoutId)
}

export function probably(rate: number) {
	return Math.random() < rate
}

export class Vec2D {
	x: number
	y: number
	angle: number

	constructor(x: number, y: number) {
		this.x = x
		this.y = y
		this.angle = 0 // in radians
	}

	get values(): [number, number] {
		return [this.x, this.y]
	}

	// Método para avanzar en la dirección actual del vector
	forward(speed: number) {
		this.x += speed * Math.cos(this.angle) // Cambia la posición en el eje x
		this.y += speed * Math.sin(this.angle) // Cambia la posición en el eje y
	}

	// Método para calcular la distancia entre dos vectores
	distanceTo(v: Vec2D): number {
		const dx = this.x - v.x // Diferencia en el eje x
		const dy = this.y - v.y // Diferencia en el eje y
		return Math.sqrt(dx * dx + dy * dy) // Pitágoras para calcular la distancia
	}

	// Método clamp para restringir el valor dentro de un rango por cada eje
	clamp(minX: number, maxX: number, minY: number, maxY: number) {
		this.x = Math.max(minX, Math.min(this.x, maxX)) // Restringir x dentro del rango [minX, maxX]
		this.y = Math.max(minY, Math.min(this.y, maxY)) // Restringir y dentro del rango [minY, maxY]
	}

	lengthSq() {
		return this.x * this.x + this.y * this.y
	}

	dot(v: Vec2D) {
		return this.x * v.x + this.y * v.y
	}

	angleTo(v: Vec2D): number {
		const translatedVx = v.x - this.x
		const translatedVy = v.y - this.y

		// Crear un vector trasladado para realizar el cálculo del ángulo
		const translatedV = new Vec2D(translatedVx, translatedVy)

		// Calcular el denominador: producto de las magnitudes de 'this' y 'translatedV'
		const denominator = Math.sqrt(this.lengthSq() * translatedV.lengthSq())

		// Si el denominador es cero (longitud de algún vector es 0), devolvemos PI/2 como caso especial
		if (denominator === 0) return Math.PI / 2

		// Calcular el coseno del ángulo usando el producto punto y el denominador
		const theta = this.dot(translatedV) / denominator

		// Asegurarse de que el valor esté en el rango [-1, 1] para evitar errores con Math.acos
		return Math.acos(clamp(theta, -1, 1))
	}
}
