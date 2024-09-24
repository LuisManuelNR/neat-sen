type NeuronType = 'input' | 'hidden' | 'output'

class Neuron {
	public id: number
	public type: NeuronType
	public value: number
	public incomingConnections: Connection[] = []
	public outgoingConnections: Connection[] = []

	constructor(id: number, type: NeuronType) {
		this.id = id
		this.type = type
		this.value = Math.random() * 2 - 1
	}

	activate() {
		if (this.type !== 'input') {
			const sum = this.incomingConnections.reduce((sum, conn) => {
				return sum + conn.weight * conn.fromNeuron.value
			}, 0)
			this.value = this.relu(sum)
		}
	}

	relu(x: number): number {
		return Math.max(0, x) // Función de activación ReLU
	}
}

class Connection {
	public fromNeuron: Neuron
	public toNeuron: Neuron
	public weight: number
	public enabled: boolean

	constructor(fromNeuron: Neuron, toNeuron: Neuron, weight: number) {
		this.fromNeuron = fromNeuron
		this.toNeuron = toNeuron
		this.weight = weight ?? Math.random() * 2 - 1
		this.enabled = true
	}

	mutateWeight() {
		// Pequeño cambio aleatorio en el peso
		const mutationAmount = Math.random() * 0.2 - 0.1 // Mutación entre -0.1 y 0.1
		this.weight += mutationAmount
	}
}

export class Brain {
	public neurons: Neuron[] = []
	public connections: Connection[] = []
	private nextNeuronId: number = 0

	constructor(inputCount: number, outputCount: number) {
		this.initializeNeurons(inputCount, outputCount)
	}

	initializeNeurons(inputCount: number, outputCount: number) {
		for (let i = 0; i < inputCount; i++) {
			this.neurons.push(new Neuron(this.nextNeuronId++, 'input'))
		}
		for (let i = 0; i < outputCount; i++) {
			this.neurons.push(new Neuron(this.nextNeuronId++, 'output'))
		}
	}

	addNeuron(neuronType: NeuronType = 'hidden') {
		const newNeuron = new Neuron(this.nextNeuronId++, neuronType)
		this.neurons.push(newNeuron)

		// Conectar el nuevo nodo con conexiones aleatorias a nodos existentes
		const existingNeurons = this.neurons.filter((n) => n.type !== 'output')
		for (let neuron of existingNeurons) {
			this.addConnection(neuron, newNeuron)
		}
		return newNeuron
	}

	addConnection(fromNeuron: Neuron, toNeuron: Neuron, weight?: number) {
		// debugger
		if (fromNeuron === toNeuron) return // Evitar conexiones con el mismo neurona

		const connectionExists = this.connections.some(
			(conn) => conn.fromNeuron === fromNeuron && conn.toNeuron === toNeuron
		)
		if (!connectionExists) {
			const newConnection = new Connection(fromNeuron, toNeuron, weight ?? Math.random() * 2 - 1)
			this.connections.push(newConnection)
			fromNeuron.outgoingConnections.push(newConnection)
			toNeuron.incomingConnections.push(newConnection)
		}
	}

	forward(inputs: number[]): number[] {
		// Asegurar que las entradas sean asignadas correctamente a las neuronas de entrada
		this.neurons
			.filter((n) => n.type === 'input')
			.forEach((neuron, i) => {
				neuron.value = inputs[i]
			})

		// Activar todas las neuronas, excepto las de entrada
		for (let neuron of this.neurons) {
			if (neuron.type !== 'input') {
				neuron.activate()
			}
		}

		// Obtener los valores de salida
		return this.neurons.filter((n) => n.type === 'output').map((n) => n.value)
	}

	mutateTopology() {
		// Agregar nueva conexión con una pequeña probabilidad
		if (Math.random() < 0.05) {
			const fromNeuron = this.neurons[Math.floor(Math.random() * this.neurons.length)]
			const toNeuron = this.neurons[Math.floor(Math.random() * this.neurons.length)]
			this.addConnection(fromNeuron, toNeuron)
		}

		// Agregar nueva neurona con una pequeña probabilidad
		if (Math.random() < 0.03) {
			this.addNeuron()
		}
	}

	mutateWeights() {
		// Mutar pesos de todas las conexiones
		for (let connection of this.connections) {
			if (Math.random() < 0.8) {
				// 80% de probabilidad de mutar
				connection.mutateWeight()
			}
		}
	}

	static crossover(parent1: Brain, parent2: Brain): Brain {
		const child = new Brain(0, 0) // Crear red neuronal del hijo sin neuronas inicialmente

		const allNeuronIds = new Set<number>()

		// Agregar neuronas de ambos padres, sin duplicar
		for (let neuron of parent1.neurons) {
			if (!allNeuronIds.has(neuron.id)) {
				const newNeuron = new Neuron(neuron.id, neuron.type)
				child.neurons.push(newNeuron)
				allNeuronIds.add(neuron.id)
			}
		}

		for (let neuron of parent2.neurons) {
			if (!allNeuronIds.has(neuron.id)) {
				const newNeuron = new Neuron(neuron.id, neuron.type)
				child.neurons.push(newNeuron)
				allNeuronIds.add(neuron.id)
			}
		}

		// Mapeo de neuronas en el hijo por ID para reconstruir conexiones
		const neuronMap: Map<number, Neuron> = new Map()
		for (let neuron of child.neurons) {
			neuronMap.set(neuron.id, neuron)
		}

		// Cruzar las conexiones entre los padres
		const allConnections: Map<string, Connection> = new Map()

		// Copiar conexiones de ambos padres sin duplicar
		for (let connection of parent1.connections) {
			const key = `${connection.fromNeuron.id}-${connection.toNeuron.id}`
			if (!allConnections.has(key)) {
				allConnections.set(key, connection)
			}
		}

		for (let connection of parent2.connections) {
			const key = `${connection.fromNeuron.id}-${connection.toNeuron.id}`
			if (!allConnections.has(key)) {
				allConnections.set(key, connection)
			}
		}

		// Reconstruir las conexiones en el hijo
		for (let [key, connection] of allConnections) {
			const parent1Connection = parent1.connections.find(
				(conn) => conn.fromNeuron.id === connection.fromNeuron.id && conn.toNeuron.id === connection.toNeuron.id
			)
			const parent2Connection = parent2.connections.find(
				(conn) => conn.fromNeuron.id === connection.fromNeuron.id && conn.toNeuron.id === connection.toNeuron.id
			)

			let newWeight
			let enabled = true

			if (parent1Connection && parent2Connection) {
				// Si ambos padres tienen la conexión, seleccionar un peso de cualquiera de los dos padres
				newWeight = Math.random() < 0.5 ? parent1Connection.weight : parent2Connection.weight
				enabled = parent1Connection.enabled && parent2Connection.enabled
			} else if (parent1Connection) {
				// Si solo el padre 1 tiene la conexión, tomarla de él
				newWeight = parent1Connection.weight
				enabled = parent1Connection.enabled
			} else if (parent2Connection) {
				// Si solo el padre 2 tiene la conexión, tomarla de él
				newWeight = parent2Connection.weight
				enabled = parent2Connection.enabled
			}

			// Crear la conexión en el hijo
			const fromNeuron = neuronMap.get(connection.fromNeuron.id)
			const toNeuron = neuronMap.get(connection.toNeuron.id)
			if (fromNeuron && toNeuron) {
				const childConnection = new Connection(fromNeuron, toNeuron, newWeight)
				childConnection.enabled = enabled
				child.connections.push(childConnection)
				fromNeuron.outgoingConnections.push(childConnection)
				toNeuron.incomingConnections.push(childConnection)
			}
		}

		return child
	}
}
