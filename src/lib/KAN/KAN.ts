import { BSpline } from './Spline'

// Función SiLU (Sigmoid Linear Unit)
function siLU(x: number): number {
	return x / (1 + Math.exp(-x))
}

// Derivada de SiLU
// function siLUDerivative(x: number): number {
// 	const expNegX = Math.exp(-x)
// 	return (1 + expNegX + x * expNegX) / Math.pow(1 + expNegX, 2)
// }

// Clase para obtener funciones de borde (SiLU y B-splines)
// function getEdgeFunctions(x_bounds: [number, number], n_fun: number, degree: number = 3) {
// 	const grid_len = n_fun - degree + 1
// 	const step = (x_bounds[1] - x_bounds[0]) / (grid_len - 1)
// 	const edge_fun: { [key: number]: (x: number) => number } = {}
// 	const edge_fun_der: { [key: number]: (x: number) => number } = {}

// 	// SiLU bias function
// 	edge_fun[0] = (x: number) => siLU(x)
// 	edge_fun_der[0] = (x: number) => siLUDerivative(x)

// 	// B-splines
// 	const t = Array.from({ length: grid_len + 2 * degree }, (_, i) => x_bounds[0] - degree * step + i * step)
// 	t[degree] = x_bounds[0]
// 	t[-degree - 1] = x_bounds[1]
// 	for (let ind_spline = 0; ind_spline < n_fun - 1; ind_spline++) {
// 		edge_fun[ind_spline + 1] = (x: number) => new BSpline(t, degree).evaluate(x)[0];
//     edge_fun_der[ind_spline + 1] = (x: number) => edge_fun[ind_spline + 1](x); // Esto es solo un placeholder
// 	}

// 	return { edge_fun, edge_fun_der }
// }

// Neurona KAN
class Neuron {
	input: number[] // Entradas
	weights: number[][]
	bSplines: BSpline[] // Ahora usamos múltiples B-splines
	bias: number
	#weightsPerEdge: number
	#degree: number

	constructor(inputSize: number, weightsPerEdge: number, degree: number = 3) {
		this.input = new Array(inputSize).fill(0)
		this.weights = new Array(inputSize)
			.fill(0)
			.map(() => new Array(weightsPerEdge).fill(0).map(() => Math.random()))
		this.#weightsPerEdge = weightsPerEdge
		this.#degree = degree
		// Generar los knots automáticamente para cada neurona y cada dimensión de entrada
		this.bSplines = this.#buildSplines()

		this.bias = Math.random()
	}

	// Calcula el valor intermedio utilizando tanto SiLU como B-splines
	getMidValue(): number[] {
		return this.input.map((x_i, i) => {
			return this.weights[i].reduce((acc, w_ik, k) => {
				// Aplicar SiLU solo al primer spline (f1)
				let splineValue = k === 0 ? siLU(x_i) : this.bSplines[i].evaluate(x_i)[0]
				return acc + w_ik * splineValue
			}, 0)
		})
	}

	// Calcula la salida final usando una función de activación (tangente hiperbólica)
	getOutput(): number {
		const midValues = this.getMidValue()
		const sumMid = midValues.reduce((acc, x_mid) => acc + x_mid, 0)
		return Math.tanh(sumMid + this.bias)
	}

	// Propagación hacia adelante
	forward(input: number[]): number {
		this.input = input
		this.bSplines = this.#buildSplines()
		return this.getOutput()
	}

	#buildSplines() {
		return this.input.map(() => {
			const knots = Array.from({ length: this.#weightsPerEdge + this.#degree + 1 }, (_, i) => i)
			return new BSpline([knots], this.#degree) // Genera una B-Spline por dimensión
		})
	}

	// Método para mutar los pesos y las funciones spline
	mutate(mutationRate: number, mutationAmount: number): void {
		// Mutar los pesos
		this.weights = this.weights.map((weightArray) =>
			weightArray.map((weight) => {
				if (Math.random() < mutationRate) {
					return weight + (Math.random() * 2 - 1) * mutationAmount
				}
				return weight
			})
		)
	}
}

class Layer {
	neurons: Neuron[]

	constructor(numNeurons: number, inputSize: number, weightsPerEdge: number, degree: number) {
		this.neurons = Array.from({ length: numNeurons }, () => new Neuron(inputSize, weightsPerEdge, degree))
	}

	// Propagación hacia adelante a través de toda la capa
	forward(input: number[]): number[] {
		return this.neurons.map((neuron) => neuron.forward(input))
	}

	// Mutar todos los pesos y las splines de la capa
	mutateLayer(mutationRate: number, mutationAmount: number): void {
		this.neurons.forEach((neuron) => neuron.mutate(mutationRate, mutationAmount))
	}
}

// Red KAN
export class Brain {
	layers: Layer[]
	inputSize: number
	outputSize: number
	weightsPerEdge: number
	degree: number
	#lasOutput: number[] = []

	constructor(inputSize: number, outputSize: number, weightsPerEdge: number, degree: number) {
		this.layers = []
		this.inputSize = inputSize
		this.outputSize = outputSize
		this.weightsPerEdge = weightsPerEdge
		this.degree = degree

		// Inicialización simple: solo una capa con el número mínimo de neuronas
		const initialLayer = new Layer(outputSize, inputSize, weightsPerEdge, degree)
		this.layers.push(initialLayer)
	}

	// Método de crossover entre dos redes Brain
	static crossover(parent1: Brain, parent2: Brain): Brain {
		// Crear un hijo con la estructura del primer padre
		const child = new Brain(parent1.inputSize, parent1.outputSize, parent1.weightsPerEdge, parent1.degree)

		// Seleccionar un punto de cruce para las capas
		const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.layers.length, parent2.layers.length))

		// Recorrer las capas
		for (let i = 0; i < Math.max(parent1.layers.length, parent2.layers.length); i++) {
			if (i < crossoverPoint) {
				// Copiar la capa del primer padre
				if (i < parent1.layers.length) {
					child.layers.push(parent1.copyLayer(i))
				}
			} else {
				// Copiar la capa del segundo padre
				if (i < parent2.layers.length) {
					child.layers.push(parent2.copyLayer(i))
				}
			}
		}

		return child
	}

	// Copia una capa (usada para el crossover)
	copyLayer(layerIndex: number): Layer {
		const originalLayer = this.layers[layerIndex]
		const newLayer = new Layer(
			originalLayer.neurons.length,
			originalLayer.neurons[0].input.length, // Asumimos que todas las neuronas tienen el mismo tamaño de entrada
			this.weightsPerEdge,
			this.degree
		)

		// Copiar las neuronas y sus parámetros
		originalLayer.neurons.forEach((neuron, i) => {
			newLayer.neurons[i].weights = structuredClone(neuron.weights)
			newLayer.neurons[i].bias = neuron.bias
		})

		return newLayer
	}

	// Propagación hacia adelante a través de toda la red
	forward(input: number[]): number[] {
		const out = this.layers.reduce((input, layer) => layer.forward(input), input)
		this.#lasOutput = out
		return out
	}

	// Mutar todas las capas de la red
	mutate(mutationRate: number, mutationAmount: number, addComplexityChance: number): void {
		this.layers.forEach((layer) => layer.mutateLayer(mutationRate, mutationAmount))

		const complexityFactor = 1 / (this.layers.length + 1) // Disminuye a medida que la red crece
		if (Math.random() < addComplexityChance * complexityFactor) {
			if (Math.random() < 0.5) {
				this.addNeuronToRandomLayer()
			} else {
				this.addLayer()
			}
		}
	}

	// Añadir una nueva neurona a una capa existente
	addNeuronToRandomLayer(): void {
		const layerIndex = Math.floor(Math.random() * this.layers.length)
		const layer = this.layers[layerIndex]
		const newNeuron = new Neuron(layer.neurons[0].input.length, this.weightsPerEdge, this.degree)
		newNeuron.mutate(0.1, 0.5) // Aplicar una mutación inicial
		layer.neurons.push(newNeuron)
	}

	// Añadir una nueva capa entre la última capa y la de salida
	addLayer(): void {
		const lastLayer = this.layers[this.layers.length - 1]
		const newLayer = new Layer(
			lastLayer.neurons.length,
			lastLayer.neurons.length,
			this.weightsPerEdge,
			this.degree
		)
		this.layers.splice(this.layers.length - 1, 0, newLayer)
	}
}
