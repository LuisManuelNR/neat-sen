import { Brain } from '$lib/KAN/Brain'

type NEATOptions<T extends { brain: Brain }> = {
	inputs: number
	outputs: number
	populationSize: number
	createIndividual: (brain: Brain) => T
}

export class Simulation<T extends { brain: Brain; fitness: number }> {
	population: T[]
	#populationSize: number
	#generation: number = 0
	#createIndividual: (brain: Brain) => T
	#inputs: number
	#outputs: number

	constructor(opt: NEATOptions<T>) {
		this.#populationSize = opt.populationSize
		this.#createIndividual = opt.createIndividual
		this.#inputs = opt.inputs
		this.#outputs = opt.outputs
		this.population = []

		// Inicialización de la población
		for (let i = 0; i < this.#populationSize; i++) {
			const brain = new Brain(this.#inputs, this.#outputs)
			this.population.push(this.#createIndividual(brain))
		}
	}

	evolve() {
		this.#generation++
		this.#selection() // Seleccionar los mejores individuos y mutar
	}

	#normalizeFitness(group: T[]) {
		let sum = 0
		group.forEach((indi) => {
			sum += indi.fitness * 2 // prevent too small
		})
		group.forEach((indi) => {
			indi.fitness /= sum
		})
	}

	#selection() {
		// Ordena la población por fitness de mayor a menor
		this.population.sort((a, b) => b.fitness - a.fitness)

		// nos quedamos con la mitad
		const half = this.population.slice(0, Math.round(this.#populationSize / 2))

		// Calcula el número de elitistas
		const elitistas = Math.floor(0.1 * half.length)

		// Selecciona los elitistas
		const elitists = half
			.slice(0, elitistas)
			.map((a) => this.#createIndividual(a.brain.clone()))

		// El resto de la población, excluyendo elitistas
		const rest = half.slice(elitistas)
		this.#normalizeFitness(rest)

		const selected = []
		// Selección por torneo hasta llenar la selección
		while (selected.length < this.#populationSize - elitistas) {
			const winner = this.#poolSelecion(rest)
			selected.push(winner)
		}

		// Actualiza la población combinando elitistas, seleccionados y nuevos individuos
		this.population = [...elitists, ...selected]
	}

	#poolSelecion(poulacho: T[]) {
		// Pick a random number between 0 and sum of all fitness
		let totalFitness = poulacho.reduce((sum, individual) => sum + individual.fitness, 0)
		let r = Math.random() * totalFitness

		// Start at 0
		let index = 0

		// Keep subtracting fitness until r reaches 0 or less
		while (r > 0 && index < poulacho.length) {
			r -= poulacho[index].fitness
			index += 1
		}

		// Adjust index to make sure it's valid
		index = Math.max(0, index - 1)

		// Create a new individual from the winner and apply mutation
		const winner = this.#createIndividual(poulacho[index].brain.clone())
		winner.brain.mutate()
		return winner
	}
	// Obtener la generación actual
	getGeneration(): number {
		return this.#generation
	}
}

function tieneElementosConMismaReferencia<T>(lista: T[]): boolean {
	for (let i = 0; i < lista.length; i++) {
		for (let j = i + 1; j < lista.length; j++) {
			// Comparamos referencias directamente
			if (lista[i] === lista[j]) {
				return true // Hay dos elementos que comparten la misma referencia
			}
		}
	}
	return false // No se encontraron elementos con la misma referencia
}
