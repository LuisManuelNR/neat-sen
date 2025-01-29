import { DAG } from '$lib/DAG'
import { clamp, linspace, randomGaussian } from '$lib/utils'

export class Brain {
	#inputSize: number
	#outputSize: number
	splines: Map<string, BSpline> = new Map()
	nControlPoints: number
	dag = new DAG({
		nodes: {
			input: (xs) => xs[0],
			hidden: sumAll,
			output: sumAll
		},
		connections: {
			identity: (x) => x,
			spline: (x, connid) => this.splines.get(connid)!.evaluate(x)
		}
	})

	constructor(inputSize: number, outputSize: number, nControlPoints = 10) {
		this.nControlPoints = nControlPoints
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		const inputsIds = []
		for (let i = 0; i < inputSize; i++) {
			const id = this.dag.addNode('input')
			inputsIds.push(id)
		}

		for (let i = 0; i < outputSize; i++) {
			const oid = this.dag.addNode('output')
			inputsIds.forEach((id) => {
				this.#connect(id, oid)
			})
		}
	}

	#connect(from: string, to: string, spline?: BSpline) {
		const connid = this.dag.connect('spline', from, to)
		if (!connid) return
		if (spline) {
			this.splines.set(connid, spline.clone())
		} else {
			this.splines.set(connid, new BSpline(this.nControlPoints, 2))
		}
	}

	#disconnect(from: string, to: string) {
		const connid = this.dag.disconnect(from, to)
		if (!connid) return
		const spline = this.splines.get(connid)
		this.splines.delete(connid)
		return spline!
	}

	addEdge() {
		const sorted = this.dag.sorted
		const available: string[][] = []
		const prevBatch: string[] = []
		for (let i = 1; i < sorted.length; i++) {
			const batch = sorted[i]
			prevBatch.push(...sorted[i - 1])
			batch.forEach((to) => {
				prevBatch.forEach((from) => {
					if (!this.dag.connections.has(`${from}_${to}`)!) {
						available.push([from, to])
					}
				})
			})
		}
		if (available.length === 0) return
		const [from, to] = randomElement(available)
		this.#connect(from, to)
	}

	removeEdge() {
		if (this.dag.connections.size < this.dag.nodes.size) return
		const candidates: [string, string][] = []
		for (const [from, deps] of this.dag.graph) {
			if (deps.size > 1) {
				deps.forEach((to) => {
					let iter = 0
					for (const [from2, deps2] of this.dag.graph) {
						if (from2 !== from && deps2.has(to)) iter++
						if (iter > 2) {
							candidates.push([from, to])
							return
						}
					}
				})
			}
		}
		if (!candidates.length) return
		const [from, to] = randomElement(candidates)
		this.#disconnect(from, to)
	}

	addNode() {
		// 1. Filtrar las conexiones existentes
		const conexiones: Array<[string, string]> = []
		for (const [key] of this.dag.connections) {
			const [from, to] = key.split('_')
			conexiones.push([from, to])
		}

		if (conexiones.length === 0) return

		// 2. Seleccionar una conexión aleatoria
		const [from, to] = randomElement(conexiones)

		// 3. Desconectar la conexión seleccionada
		const spline = this.#disconnect(from, to)

		// 4. Crear un nuevo nodo
		const nuevoNodo = this.dag.addNode('hidden')

		// 5. Establecer nuevas conexiones
		this.#connect(from, nuevoNodo, spline)
		this.#connect(nuevoNodo, to)
	}

	removeNode() {
		if (this.dag.nodes.size === this.#inputSize + this.#outputSize) return
		const hiddens: string[] = []
		for (const [id, type] of this.dag.nodes) {
			if (type === 'hidden') hiddens.push(id)
		}
		const rNodeId = randomElement(hiddens)

		const incommingConnections = []
		for (const [from, deps] of this.dag.graph) {
			if (deps.has(rNodeId)) incommingConnections.push(from)
		}
		const outgoingConnections = [...this.dag.graph.get(rNodeId)!]

		incommingConnections.forEach((input) => {
			outgoingConnections.forEach((output) => {
				if (!this.dag.graph.get(input)!.has(output)) {
					this.#connect(input, output)
				}
			})
		})

		this.dag.removeNode(rNodeId)
		for (const [connid] of this.splines) {
			if (connid.includes(rNodeId)) this.splines.delete(connid)
		}
	}

	async forward(inputs: number[]) {
		if (inputs.length !== this.#inputSize) throw new Error('Inputs length must match')
		const pr = await this.dag.process(inputs)
		const r: number[] = []
		for (const [id, { type, value }] of pr) {
			if (type === 'output') {
				r.push(value)
			}
		}
		return r
	}

	mutate() {
		if (Math.random() < 0.9) {
			this.splines.forEach((s) => s.mutate())
		} else {
			const probabilty = Math.floor(Math.random() * 5)
			if (probabilty === 0) this.addNode()
			if (probabilty === 1) this.addEdge()
			if (probabilty === 2) this.removeNode()
			if (probabilty === 3) this.removeEdge()
		}
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize, this.nControlPoints)
		clone.dag = this.dag.clone(clone.dag.store)
		clone.splines.clear()
		for (const [id, spline] of this.splines) {
			clone.splines.set(id, spline.clone())
		}
		return clone
	}

	draw(width: number, height: number) {
		const g = this.dag.draw(width, height)
		const splines = g.connectionPositions.map((c) => ({
			spline: this.splines.get(`${c[4]}_${c[5]}`)!,
			x: (c[0] + c[1]) / 2,
			y: (c[2] + c[3]) / 2
		}))
		return {
			...g,
			splines
		}
	}
}

function sumAll(inputs: number[]) {
	const w = 1 / inputs.length
	const sum = inputs.reduce((prev, current) => prev * w + current, 0)
	return sum
}
function randomElement<T>(arr: T[]) {
	const i = Math.floor(Math.random() * arr.length)
	return arr[i]
}


class BSpline {
	points: number[]
	knots: number[] = []
	degree

	constructor(points: number[] | number, degree: number) {
		this.points = Array.isArray(points)
			? points
			: Array(points)
				.fill(0)
				.map(() => Math.random())

		this.degree = degree
		this.#buildKnots()
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

		if (x < low) x = low
		if (x > high) x = high

		// if (x < low || x > high) throw new Error(`x is out of bounds, x=${x}, [${low}, ${high}]`)

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

	#buildKnots() {
		this.knots = Array.from({ length: this.points.length + this.degree + 1 }, (_, i) => i)
	}

	mutate() {
		// Mutación de los puntos existentes
		this.points = this.points.map((c) => {
			if (Math.random() > 0.1) {
				// Mutación pequeña basada en una distribución gaussiana
				c += randomGaussian(0, 0.01)
				c = clamp(c, 0, 1) // Asegura que esté dentro de [0, 1]
			} else if (Math.random() < 0.03) {
				// Mutación más drástica: reemplazo aleatorio
				c = Math.random()
			}
			return c
		})
	}

	// Clonación de la spline
	clone(): BSpline {
		return new BSpline([...this.points], this.degree)
	}
}
