import { sigmoid } from '$lib/utils'

export class Brain {
	private weights: number[][] // Pesos entre capas
	private biases: number[] // Sesgos para la capa de salida

	constructor(inputSize: number, outputSize: number, hiddenSize: number = 8) {
		// Inicialización de pesos y sesgos con valores aleatorios
		this.weights = [
			Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1), // Capa de entrada a capa oculta
			Array.from({ length: outputSize }, () => Math.random() * 2 - 1) // Capa oculta a capa de salida
		]
		this.biases = Array.from({ length: outputSize }, () => Math.random() * 2 - 1)
	}

	// Propagación hacia adelante
	forward(inputs: number[]): number[] {
		// Capa oculta: multiplicación de entrada y pesos, luego activación
		const hiddenOutputs = this.weights[0].map((weight, i) =>
			sigmoid(inputs.reduce((acc, input, j) => acc + input * weight, 0))
		)

		// Capa de salida: multiplicación de salida de la capa oculta con pesos y aplicación de sesgo
		const outputs = this.weights[1].map((weight, i) =>
			sigmoid(
				hiddenOutputs.reduce((acc, hiddenOutput, j) => acc + hiddenOutput * weight, this.biases[i])
			)
		)

		return outputs
	}

	// Mutación de la red
	mutate(rate: number = 0.1) {
		this.weights.forEach((layer) => {
			for (let i = 0; i < layer.length; i++) {
				if (Math.random() < rate) {
					layer[i] += Math.random() * 0.2 - 0.1 // Ajuste pequeño aleatorio
				}
			}
		})
		this.biases.forEach((bias, i) => {
			if (Math.random() < rate) {
				this.biases[i] += Math.random() * 0.2 - 0.1
			}
		})
	}

	// Clonación de la red
	clone(): Brain {
		const clone = new Brain(this.weights[0].length, this.weights[1].length)
		clone.weights = this.weights.map((layer) => [...layer])
		clone.biases = [...this.biases]
		return clone
	}
}
