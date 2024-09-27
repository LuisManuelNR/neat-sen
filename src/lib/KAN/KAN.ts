// Función B-spline
function bSpline(x: number, knots: number[], degree: number): number {
	if (degree === 0) {
		return (knots[0] <= x && x < knots[1]) ? 1 : 0
	} else {
		const d1 = knots[degree] - knots[0]
		const d2 = knots[degree + 1] - knots[1]
		const term1 = d1 !== 0 ? (x - knots[0]) / d1 * bSpline(x, knots.slice(0, degree), degree - 1) : 0
		const term2 = d2 !== 0 ? (knots[degree + 1] - x) / d2 * bSpline(x, knots.slice(1), degree - 1) : 0
		return term1 + term2
	}
}

// Neurona KAN
class Neuron {
	input: number[]
	weights: number[][]
	knots: number[]
	degree: number
	bias: number

	constructor(inputSize: number, weightsPerEdge: number, degree: number = 3) {
		this.input = new Array(inputSize).fill(0)
		this.weights = new Array(inputSize).fill(0).map(() => new Array(weightsPerEdge).fill(0).map(() => Math.random()))
		this.knots = Array.from({ length: weightsPerEdge + degree + 1 }, (_, i) => i)
		this.degree = degree
		this.bias = Math.random()
	}

	// Calcula el valor intermedio usando funciones de borde (B-spline)
	getMidValue(): number[] {
		return this.input.map((x_i, i) => {
			return this.weights[i].reduce((acc, w_ik, k) => {
				return acc + w_ik * bSpline(x_i, this.knots.slice(k, k + this.degree + 2), this.degree)
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
		debugger
		this.input = input
		return this.getOutput()
	}

	// Método para mutar los pesos y las funciones spline
	mutate(mutationRate: number, mutationAmount: number): void {
		// Mutar los pesos
		this.weights = this.weights.map(weightArray =>
			weightArray.map(weight => {
				if (Math.random() < mutationRate) {
					// Aplicar mutación: añadir una pequeña variación aleatoria al peso
					return weight + (Math.random() * 2 - 1) * mutationAmount
				}
				return weight
			})
		)

		// Mutar los nodos del B-spline (knots)
		this.knots = this.knots.map(knot => {
			if (Math.random() < mutationRate) {
				// Aplicar mutación: añadir una pequeña variación aleatoria al knot
				return knot + (Math.random() * 2 - 1) * mutationAmount
			}
			return knot
		})
	}
}

class Layer {
	neurons: Neuron[]

	constructor(numNeurons: number, inputSize: number, weightsPerEdge: number, degree: number) {
		this.neurons = Array.from({ length: numNeurons }, () => new Neuron(inputSize, weightsPerEdge, degree))
	}

	// Propagación hacia adelante a través de toda la capa
	forward(input: number[]): number[] {
		return this.neurons.map(neuron => neuron.forward(input))
	}

	// Mutar todos los pesos y las splines de la capa
	mutateLayer(mutationRate: number, mutationAmount: number): void {
		this.neurons.forEach(neuron => neuron.mutate(mutationRate, mutationAmount))
	}
}

// Red KAN
export class Brain {
	layers: Layer[]
	inputSize: number
	outputSize: number
	weightsPerEdge: number
	degree: number

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
			newLayer.neurons[i].weights = JSON.parse(JSON.stringify(neuron.weights))
			newLayer.neurons[i].knots = JSON.parse(JSON.stringify(neuron.knots))
			newLayer.neurons[i].bias = neuron.bias
		})

		return newLayer
	}

	// Propagación hacia adelante a través de toda la red
	forward(input: number[]): number[] {
		return this.layers.reduce((input, layer) => layer.forward(input), input)
	}

	// Mutar todas las capas de la red, con posibilidad de agregar capas o neuronas
	mutate(mutationRate: number, mutationAmount: number, addComplexityChance: number): void {
		this.layers.forEach(layer => layer.mutateLayer(mutationRate, mutationAmount))

		const complexityFactor = 1 / (this.layers.length + 1)  // Disminuye a medida que la red crece
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
		newNeuron.mutate(0.1, 0.5)  // Aplicar una mutación inicial
		layer.neurons.push(newNeuron)
	}

	// Añadir una nueva capa entre la última capa y la de salida
	addLayer(): void {
		const lastLayer = this.layers[this.layers.length - 1]
		const newLayer = new Layer(lastLayer.neurons.length, lastLayer.neurons.length, this.weightsPerEdge, this.degree)
		this.layers.splice(this.layers.length - 1, 0, newLayer)
	}

	// Controlar que el número de entradas y salidas se respete
	validateNetwork(): void {
		const firstLayerInputSize = this.layers[0].neurons[0].input.length
		if (firstLayerInputSize !== this.inputSize) {
			throw new Error("Tamaño de entrada inválido en la primera capa")
		}

		const lastLayerOutputSize = this.layers[this.layers.length - 1].neurons.length
		if (lastLayerOutputSize !== this.outputSize) {
			throw new Error("Tamaño de salida inválido en la última capa")
		}
	}
	// Guardar el modelo
	saveModel(): object {
		return {
			layers: this.layers.map(layer => ({
				neurons: layer.neurons.map(neuron => ({
					weights: neuron.weights,
					knots: neuron.knots,
					bias: neuron.bias
				}))
			}))
		}
	}

	// Cargar un modelo
	loadModel(model: any): void {
		if (model.layers.length !== this.layers.length) {
			throw new Error("El modelo cargado no tiene la misma estructura de capas.")
		}
		model.layers.forEach((layerData: any, layerIndex: number) => {
			if (layerData.neurons.length !== this.layers[layerIndex].neurons.length) {
				throw new Error(`La capa ${layerIndex} del modelo cargado no coincide en número de neuronas.`)
			}
			this.layers[layerIndex].neurons.forEach((neuron, neuronIndex) => {
				neuron.weights = layerData.neurons[neuronIndex].weights
				neuron.knots = layerData.neurons[neuronIndex].knots
				neuron.bias = layerData.neurons[neuronIndex].bias
			})
		})
	}

}