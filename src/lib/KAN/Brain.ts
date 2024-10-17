import { Layer } from './Layer'
import { probably, silu } from '$lib/utils'

type BrainOptions = {
	mutationRate?: number
	mutationLayerRate?: number
}
export class Brain {
	layers: Layer[]
	#inputSize: number
	#outputSize: number
	#mutationRate: number
	#mutationLayerRate: number

	constructor(inputSize: number, outputSize: number, opt?: BrainOptions) {
		this.#inputSize = inputSize
		this.#outputSize = outputSize

		this.#mutationRate = opt?.mutationRate || 0.3
		this.#mutationLayerRate = opt?.mutationLayerRate || 0.01

		this.layers = [new Layer(inputSize, outputSize)]
	}

	forward(inputs: number[]) {
		// Propagar a través de todas las capas
		let outputs = inputs
		for (const layer of this.layers) {
			outputs = layer.forward(outputs)
		}
		return outputs
	}

	addLayer(position?: number, layerSize?: number) {
		// Definir la posición y el tamaño de la capa nueva
		const layerInputSize =
			position === undefined || position === 0 ? this.#inputSize : this.layers[position - 1].outputs
		const layerOutputSize = layerSize || this.layers[0].inputs

		const newLayer = new Layer(layerInputSize, layerOutputSize)

		// Insertar la capa en la posición indicada o al comienzo por defecto
		if (position === undefined || position === 0) {
			this.layers = [newLayer, ...this.layers]
		} else {
			this.layers.splice(position, 0, newLayer)
		}
	}

	// Método para remover una capa en una posición específica o la última capa
	removeLayer(position?: number) {
		if (this.layers.length <= 1) return

		// Si no se da posición, eliminar la última capa
		if (position === undefined) {
			position = this.layers.length - 1
		}

		// Validar que la posición esté dentro del rango
		if (position < 0 || position >= this.layers.length) {
			throw new Error(
				`Posición inválida: ${position}. El índice debe estar entre 0 y ${this.layers.length - 1}`
			)
		}

		// Remover la capa en la posición indicada
		this.layers.splice(position, 1)

		// Ajustar las conexiones de capas si se elimina una capa intermedia
		if (position > 0 && position < this.layers.length) {
			const previousLayer = this.layers[position - 1]
			const nextLayer = this.layers[position]
			previousLayer.outputs = nextLayer.inputs
		} else if (position === 0 && this.layers.length > 0) {
			// Si se elimina la primera capa, conectar la entrada general a la nueva primera capa
			this.layers[0].inputs = this.#inputSize
		}
	}

	mutate() {
		if (probably(this.#mutationRate)) {
			this.layers.forEach((l) => l.mutate())
		}
		// if (probably(this.#mutationLayerRate)) {
		// 	this.#mutationLayerRate -= 0.01
		// 	this.addLayer()
		// }
		// const inv = 1 / (1 + this.#mutationLayerRate)
		// if (probably(inv)) {
		// 	this.removeLayer()
		// }
	}

	clone() {
		const clone = new Brain(this.#inputSize, this.#outputSize)
		clone.layers = this.layers.map((l) => l.clone())
		return clone
	}
}
