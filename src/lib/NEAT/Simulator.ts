import type { Brain } from '$lib/Network'

export interface Agent {
	brain: Brain
	train: () => void
}

export type CreateFunction<T> = () => T

export class Simulation<T extends Agent> {
	population: T[]
	#populationSize: number
	#create: CreateFunction<T>

	generation = 0
	best: T
	fitness = 0

	constructor(populationSize: number, create: CreateFunction<T>) {
		this.#populationSize = populationSize
		this.population = []
		this.#create = create
		this.best = create()

		for (let i = 0; i < this.#populationSize; i++) {
			this.population.push(create())
		}
	}

	evolve() {
		this.#updateStats()
		this.#selection()
		this.generation++
	}

	#updateStats() {
		this.population.sort((a, b) => b.brain.fitness - a.brain.fitness)

		const best = this.population[0]
		this.fitness = best.brain.fitness

		const newbest = this.#create()
		newbest.brain = best.brain.clone()
		this.best = newbest
	}

	#normalizeFitness(group: Agent[]) {
		const sum = group.reduce((total, indi) => total + indi.brain.fitness, 0)
		group.forEach((indi) => {
			indi.brain.fitness /= sum
		})
	}

	#selection() {
		// this.population.sort((a, b) => b.brain.fitness - a.brain.fitness)

		const half = this.population.slice(0, Math.round(this.#populationSize / 2))

		const elitistas = Math.floor(0.1 * half.length)

		const elitists = half.slice(0, elitistas).map((e) => {
			const agent = this.#create()
			agent.brain = e.brain.clone()
			return agent
		})

		const others = half.slice(elitistas, half.length)

		this.#normalizeFitness(others)

		const selected = this.#pickAndFill(others, this.#populationSize - elitistas)

		this.population = [...elitists, ...selected]
	}

	#pickAndFill(candidates: Agent[], numToSelect: number) {
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

	#pickOne(items: Agent[]) {
		let r = Math.random()

		for (const item of items) {
			r -= item.brain.fitness
			if (r <= 0) return item
		}

		return items[0]
	}
}
