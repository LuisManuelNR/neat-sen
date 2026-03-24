import { isInside, linearScale, randomNumber } from '@chasi/ui/utils'

export function identity(x: number) {
	return x
}

export function sum(x: number[]) {
	return x.reduce((p, c) => p + c, 0)
}

export function linspace(min: number, max: number, N: number): number[] {
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

export function randomGaussian(mean: number, std: number): number {
	let u = 0
	let v = 0
	let s = 0

	do {
		u = Math.random() * 2 - 1
		v = Math.random() * 2 - 1
		s = u * u + v * v
	} while (s === 0 || s >= 1)

	const mul = Math.sqrt(-2.0 * Math.log(s) / s)
	return mean + std * u * mul
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

export function probably(rate: number) {
	return Math.random() < rate
}

export function tanhAct(x: number, getDerivative: boolean = false): number {
	if (!getDerivative) {
		return Math.tanh(x)
	}
	return 1 - Math.tanh(x) ** 2
}

export function sigmoidAct(x: number, getDerivative: boolean = false): number {
	if (!getDerivative) {
		return 1 / (1 + Math.exp(-x))
	}
	const sigmoid = sigmoidAct(x, false) // Calcula el valor del sigmoide
	return sigmoid * (1 - sigmoid)
}

export function randomElement<T>(arr: readonly T[]) {
	const i = Math.floor(Math.random() * arr.length)
	return arr[i]
}

export function randomIndex(arr: readonly any[]) {
	const i = Math.floor(Math.random() * arr.length)
	return i
}

export function random(min = 0, max = 1) {
	return Math.random() * (max - min) + min
}
export function randomInt(min = 0, max = 1) {
	return Math.floor(random(min, max))
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

export function runEveryFrames(
	fnFrames: () => number,
	callback: () => void | Promise<void>
): () => void {
	let stop = false // Bandera para detener el loop

	async function loop() {
		if (stop) return // Si se detiene, salir del loop

		const executionsPerFrame = fnFrames() // Obtiene cuántas veces ejecutar `callback` en este frame

		// Ejecuta `callback` el número de veces indicado por `fnFrames`
		for (let i = 0; i < executionsPerFrame; i++) {
			await callback() // Espera a que el callback termine
		}

		// Llama al siguiente frame
		requestAnimationFrame(loop)
	}

	// Inicia el loop
	loop()

	// Devuelve una función para detener el loop
	return () => {
		stop = true
	}
}

export function std(x: number[]): number {
	const len = x.length
	if (len < 2) return 0
	const mu = x.reduce((a, c) => a + c, 0) / len
	const ma = x.reduce((sum, value) => {
		const diff = value - mu
		return sum + diff * diff
	}, 0)

	const variance = ma / (len - 1)

	return Math.sqrt(variance)
}

type Standardized = {
	values: number[]
	mu: number
	sigma: number
}

export function standardize(x: number[]): Standardized {
	const len = x.length

	if (len === 0) {
		return { values: [], mu: 0, sigma: 0 }
	}

	if (len === 1) {
		return { values: [0], mu: x[0], sigma: 0 }
	}

	const mu = x.reduce((a, c) => a + c, 0) / len

	const variance =
		x.reduce((sum, value) => {
			const diff = value - mu
			return sum + diff * diff
		}, 0) /
		(len - 1)

	const sigma = Math.sqrt(variance)

	// ⚠️ evitar división por 0
	if (sigma === 0) {
		return {
			values: new Array(len).fill(0),
			mu,
			sigma
		}
	}

	return {
		values: x.map((v) => (v - mu) / sigma),
		mu,
		sigma
	}
}

export function destandardize(z: number[], mu: number, sigma: number): number[] {
	// si sigma es 0, todos los valores originales eran iguales a mu
	if (sigma === 0) {
		return new Array(z.length).fill(mu)
	}

	return z.map((v) => v * sigma + mu)
}

export type Standardizer = {
	standardize: (x: number[]) => number[]
	destandardize: (z: number[]) => number[]
	mu: () => number
	sigma: () => number
}

export function createStandardizer(): Standardizer {
	let _mu = 0
	let _sigma = 0

	function standardize(x: number[]): number[] {
		const len = x.length

		if (len === 0) {
			_mu = 0
			_sigma = 0
			return []
		}

		if (len === 1) {
			_mu = x[0]
			_sigma = 0
			return [0]
		}

		_mu = x.reduce((a, c) => a + c, 0) / len

		const variance =
			x.reduce((sum, value) => {
				const diff = value - _mu
				return sum + diff * diff
			}, 0) /
			(len - 1)

		_sigma = Math.sqrt(variance)

		if (_sigma === 0) {
			return new Array(len).fill(0)
		}

		return x.map((v) => (v - _mu) / _sigma)
	}

	function destandardize(z: number[]): number[] {
		if (_sigma === 0) {
			return new Array(z.length).fill(_mu)
		}

		return z.map((v) => v * _sigma + _mu)
	}

	return {
		standardize,
		destandardize,
		mu: () => _mu,
		sigma: () => _sigma
	}
}
