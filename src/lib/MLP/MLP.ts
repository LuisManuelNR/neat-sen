import { randomNumber } from '@chasi/ui/utils'
import { randomGaussian, sigmoid } from '../utils'

const NEURON_TYPE = {
	INPUT: 0,
	HIDDEN: 1,
	OUTPUT: 2
} as const

type NeuronType = (typeof NEURON_TYPE)[keyof typeof NEURON_TYPE]

class Neuron {
	public id: number
	public type: NeuronType
	public value: number
	public bias: number // Añadido el bias
	public incomingConnections: Connection[] = []
	public outgoingConnections: Connection[] = []

	constructor(id: number, type: NeuronType) {
		this.id = id
		this.type = type
		this.value = randomNumber(0, 1)
		this.bias = randomNumber(-1, 1) // Inicializa el bias con un valor aleatorio
	}

	activate() {
		if (this.type !== NEURON_TYPE.INPUT) {
			const sum = this.incomingConnections.reduce((sum, conn) => sum + conn.weight * conn.source.value, 0)
			// Incluye el bias en el cálculo de activación
			this.value = sigmoid(sum + this.bias)
		}
	}

	mutateBias() {
		// Mutar el bias de la neurona con una ligera variación gaussiana
		this.bias += randomGaussian(0.1, 0.2)
	}
}

class Connection {
	source: Neuron
	target: Neuron
	weight: number

	constructor(source: Neuron, target: Neuron) {
		this.source = source
		this.target = target
		this.weight = randomNumber(0, 1)
	}

	mutateWeight() {
		this.weight += randomGaussian(0.1, 0.2)
	}
}

export class Brain {
	neurons: Neuron[] = []
	connections: Connection[] = []
	inputNeurons: Neuron[] = []
	outputNeurons: Neuron[] = []
	#nextNeuronId: number = 0

	constructor(inputCount: number, outputCount: number) {
		// Crear neuronas de entrada
		for (let i = 0; i < inputCount; i++) {
			const neuron = new Neuron(this.#nextNeuronId++, NEURON_TYPE.INPUT)
			this.neurons.push(neuron)
			this.inputNeurons.push(neuron)
		}

		// Crear neuronas de salida
		for (let i = 0; i < outputCount; i++) {
			const neuron = new Neuron(this.#nextNeuronId++, NEURON_TYPE.OUTPUT)
			this.neurons.push(neuron)
			this.outputNeurons.push(neuron)
		}

		// Conectar neuronas de entrada directamente con neuronas de salida (opcional, si se requiere al inicio)
		this.connectInitialLayers()
	}

	connectInitialLayers() {
		// Conectar todas las neuronas de entrada con todas las neuronas de salida
		for (let inputNeuron of this.inputNeurons) {
			for (let outputNeuron of this.outputNeurons) {
				this.addConnection(inputNeuron, outputNeuron)
			}
		}
	}

	addNeuron() {
		// Asegurar que la nueva neurona se conecte correctamente dentro del flujo
		const validfromNeuron = this.neurons.filter((n) => n.type !== NEURON_TYPE.OUTPUT)
		const fromNeuron = validfromNeuron[randomNumber(0, validfromNeuron.length - 1)]

		const validtoNeuron = this.neurons.filter((n) => n.type !== NEURON_TYPE.INPUT)
		const toNeuron = validtoNeuron[randomNumber(0, validtoNeuron.length - 1)]

		const neuron = new Neuron(this.#nextNeuronId++, NEURON_TYPE.HIDDEN)
		this.neurons.push(neuron)
		this.addConnection(fromNeuron, neuron)
		this.addConnection(neuron, toNeuron)
	}

	addConnection(fromNeuron: Neuron, toNeuron: Neuron) {
		// Validar que la conexión respete el flujo
		if (fromNeuron.type === NEURON_TYPE.OUTPUT || toNeuron.type === NEURON_TYPE.INPUT || fromNeuron === toNeuron) {
			// No se permite conectar de salida a entrada ni crear bucles
			return
		}

		// Añadir la conexión si cumple las reglas
		const connection = new Connection(fromNeuron, toNeuron)
		fromNeuron.outgoingConnections.push(connection)
		toNeuron.incomingConnections.push(connection)
		this.connections.push(connection)
	}

	forward(inputs: number[]): number[] {
		// Asignar los valores de entrada
		this.inputNeurons.forEach((neuron, index) => {
			neuron.value = inputs[index] || 0
		})

		// Activar las neuronas ocultas y de salida en el orden correcto
		this.neurons.filter((neuron) => neuron.type !== NEURON_TYPE.INPUT).forEach((neuron) => neuron.activate())

		// Retornar los valores de salida
		return this.outputNeurons.map((neuron) => neuron.value)
	}

	mutate() {
		// Mutar la topología de la red o los pesos
		if (randomNumber(0, 1) > 0.05) {
			this.#mutateTopology()
		}
		if (randomNumber(0, 1) < 0.1) {
			this.#mutateWeights()
		}
	}

	#mutateTopology() {
		// Añadir nuevas conexiones o neuronas de forma controlada
		if (randomNumber(0, 1) < 0.5) {
			const fromNeuron = this.neurons[randomNumber(0, this.neurons.length - 1)]
			const toNeuron = this.neurons[randomNumber(0, this.neurons.length - 1)]

			if (fromNeuron !== toNeuron) {
				this.addConnection(fromNeuron, toNeuron)
			}
		} else {
			this.addNeuron()
		}
	}

	#mutateWeights() {
		// Mutar los pesos y el bias
		this.connections.forEach((connection) => connection.mutateWeight())
		this.neurons.forEach((neuron) => neuron.mutateBias())
	}

	crossover(partnerBrain: Brain): Brain {
		const child = new Brain(0, 0)

		// Cruzar las neuronas
		this.neurons.forEach((neuron) => {
			const partnerNeuron = partnerBrain.neurons.find((n) => n.id === neuron.id)
			if (partnerNeuron) {
				const childNeuron = new Neuron(neuron.id, neuron.type)
				child.neurons.push(childNeuron)
			}
		})

		// Cruzar las conexiones
		this.connections.forEach((connection) => {
			const partnerConnection = partnerBrain.connections.find(
				(c) => c.source.id === connection.source.id && c.target.id === connection.target.id
			)
			if (partnerConnection) {
				const childConnection = new Connection(connection.source, connection.target)
				child.connections.push(childConnection)
			}
		})

		return child
	}
}
