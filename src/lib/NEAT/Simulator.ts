import { Brain } from '$lib/KAN/Brain'

type NEATOptions<T extends { brain: Brain }> = {
	inputs: number
	outputs: number
	populationSize: number
	createIndividual: (brain: Brain) => T
}

export class Simulation<T extends { brain: Brain, fitness: number }> {
	population: T[]
	#populationSize: number
	#generation: number = 0
	#createIndividual: (brain: Brain) => T
	#inputs: number
	#outputs: number
	#best: T

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
		const brain = new Brain(this.#inputs, this.#outputs)
		this.#best = this.#createIndividual(brain)
	}

	evolve() {
		this.#updateBest()
		this.#generation++
		this.#normalizeFitness()
		this.#selection() // Seleccionar los mejores individuos y mutar
		this.#mutate()
	}

	#normalizeFitness() {
		let sum = 0
		this.population.forEach((indi) => {
			indi.fitness = Math.pow(indi.fitness, 2)
			sum += indi.fitness
		})
		this.population.forEach((indi) => {
			indi.fitness /= sum
		})
	}

	#updateBest() {
		this.population.sort((a, b) => b.fitness - a.fitness)
		// if (this.population[0].brain.fitness > this.#best.brain.fitness) {
		// 	this.#best = this.#createIndividual(this.population[0].brain.clone())
		// 	this.#best.brain.fitness = this.population[0].brain.fitness
		// }
		this.#best = this.#createIndividual(this.population[0].brain.clone())
	}

	#selection() {
		const selected = []
		while (selected.length < this.#populationSize) {
			const winner = this.#poolSelecion(this.population)
			selected.push(winner)
		}

		this.population = selected
	}

	#mutate() {
		this.population.forEach((p) => p.brain.mutate())
	}

	#poolSelecion(poulacho: T[]) {
		// Start at 0
		let index = 0

		// Pick a random number between 0 and 1
		let r = Math.random()

		// Keep subtracting probabilities until you get less than zero
		// Higher probabilities will be more likely to be fixed since they will
		// subtract a larger number towards zero
		while (r > 0) {
			r -= poulacho[index].fitness
			// And move on to the next
			index += 1
		}

		// Go back one
		index -= 1

		// Make sure it's a copy!
		// (this includes mutation)
		return this.#createIndividual(poulacho[index].brain.clone())
	}
	// Obtener el mejor individuo basado en el fitness
	getBestIndividual() {
		return this.#best
	}

	// Obtener la generación actual
	getGeneration(): number {
		return this.#generation
	}
}
