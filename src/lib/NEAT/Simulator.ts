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
		const elitists = half.slice(0, elitistas).map((e) => {
			const agent = this.#create()
			agent.brain = e.brain.clone()
			return agent
		})

		const others = half.slice(elitistas, half.length)
		this.#normalizeFitness(others)
		const selected = this.#pickAndFill(others, this.#populationSize - elitistas)

		// Actualiza la población combinando elitistas, seleccionados y nuevos individuos
		this.population = [...elitists, ...selected]
	}

	#pickAndFill(candidates: T[], numToSelect: number) {
		const group = []
		for (let i = 0; i < numToSelect; i++) {
			const selected = this.#pickOne(candidates)
			const clone = this.#create()
			clone.brain = selected.brain.clone()
			clone.brain.mutate()
			group.push(clone)
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
