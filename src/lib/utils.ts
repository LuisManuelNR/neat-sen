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
		// @ts-ignore
		if (isInside(vertice.toArray(), _t)) return true
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

export class VecN {
	values: number[]
	constructor(...components: number[]) {
		this.values = components
	}

	// Obtener un valor en una dimensión específica
	getComponent(index: number): number {
		return this.values[index]
	}

	// Establecer un valor en una dimensión específica
	setComponent(index: number, value: number) {
		this.values[index] = value
	}

	toArray() {
		return [...this.values]
	}

	// Método para obtener la distancia a otro punto en N dimensiones
	distanceTo(point: VecN): number {
		if (this.values.length !== point.values.length) {
			throw new Error("Los vectores deben tener el mismo número de dimensiones")
		}

		let sum = 0
		for (let i = 0; i < this.values.length; i++) {
			const delta = point.values[i] - this.values[i]
			sum += delta * delta
		}
		return Math.sqrt(sum)
	}

	// Método para calcular la magnitud (longitud) del vector
	magnitude(): number {
		let sum = 0
		for (let i = 0; i < this.values.length; i++) {
			sum += this.values[i] * this.values[i]
		}
		return Math.sqrt(sum)
	}

	// Método para normalizar el vector (hace que su magnitud sea 1)
	normalize() {
		const magnitud = this.magnitude()
		if (magnitud !== 0) {
			for (let i = 0; i < this.values.length; i++) {
				this.values[i] /= magnitud
			}
		}
		return this
	}

	// **Nuevo método para obtener el ángulo con respecto a otro vector en N dimensiones**
	angleTo(other: VecN): number {
		if (this.values.length !== other.values.length) {
			throw new Error("Los vectores deben tener el mismo número de dimensiones")
		}

		// Producto punto
		let dotProduct = 0
		for (let i = 0; i < this.values.length; i++) {
			dotProduct += this.values[i] * other.values[i]
		}

		// Magnitudes de los dos vectores
		const magnitude1 = this.magnitude()
		const magnitude2 = other.magnitude()

		// Asegurarse de que no haya divisiones por 0
		if (magnitude1 === 0 || magnitude2 === 0) {
			return 0 // Retorna NaN si alguno de los vectores tiene magnitud cero
		}

		// Cálculo del ángulo en radianes usando la fórmula del producto punto
		const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2))

		// Convertir el ángulo a grados
		const angleDeg = (angleRad * 180) / Math.PI
		return angleDeg
	}
}

export class Vec2D extends VecN {
	direccion: number
	constructor(x: number, y: number) {
		super(x, y)
		this.direccion = 0
	}
	get x() {
		return this.getComponent(0)
	}
	get y() {
		return this.getComponent(1)
	}
	set x(v: number) {
		this.setComponent(0, v)
	}
	set y(v: number) {
		this.setComponent(0, v)
	}

	// Método para avanzar en la dirección actual del vector (solo en 2D o 3D)
	forward(speed: number) {
		if (this.values.length < 2) {
			throw new Error("El método forward solo se aplica a vectores de 2 o más dimensiones")
		}
		const rad = (Math.PI / 180) * (this.direccion - 90) // Convertir grados a radianes
		this.values[0] += speed * Math.cos(rad)
		this.values[1] += speed * Math.sin(rad)
	}

	// Método para retroceder en la dirección actual del vector (solo en 2D o 3D)
	backward(speed: number) {
		if (this.values.length < 2) {
			throw new Error("El método backward solo se aplica a vectores de 2 o más dimensiones")
		}
		const rad = (Math.PI / 180) * (this.direccion - 90) // Convertir grados a radianes
		this.values[0] -= speed * Math.cos(rad)
		this.values[1] -= speed * Math.sin(rad)
	}
}