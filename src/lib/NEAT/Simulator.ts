import type { Brain } from '$lib/Network'

export type Agent = { brain: Brain }
export type CreateFunction<T> = () => T
export class Simulation<T extends Agent> {
	population: T[]
	#populationSize: number
	#create: CreateFunction<T>

	constructor(populationSize: number, create: CreateFunction<T>) {
		this.#populationSize = populationSize
		this.population = []
		this.#create = create

		// Inicialización de la población
		for (let i = 0; i < this.#populationSize; i++) {
			this.population.push(this.#create())
		}
	}

	evolve() {
		this.#selection() // Seleccionar los mejores individuos y mutar
	}

	#normalizeFitness(group: T[]) {
		const sum = group.reduce((total, indi) => total + indi.brain.fitness, 0)
		group.forEach((indi) => {
			indi.brain.fitness /= sum
		})
	}

	#selection() {
		this.population.sort((a, b) => b.brain.fitness - a.brain.fitness)
		// nos quedamos con la mitad
		const half = this.population.slice(0, Math.round(this.#populationSize / 2))
		// top 10%
		const elitistas = Math.floor(0.1 * half.length)
		// Selecciona los elitistas
		const elitists = half.slice(0, elitistas)

		// la suma de todos a 1
		this.#normalizeFitness(half)
		const selected = this.#pickAndFill(half, this.#populationSize)

		// Actualiza la población combinando elitistas, seleccionados y nuevos individuos
		this.population = [...elitists, ...selected]
	}

	#pickAndFill(candidates: T[], numToSelect: number) {
		const group = []
		for (let i = 0; i < numToSelect; i++) {
			const selected = this.#pickOne(candidates)
			const clone = selected.brain.clone()
			clone.mutate()
			selected.brain = clone
			group.push(selected)
		}
		return group
	}

	#pickOne(items: T[]) {
		let r = Math.random()

		for (const item of items) {
			r -= item.brain.fitness
			if (r <= 0) return item
		}

		return items[0]
	}
}
