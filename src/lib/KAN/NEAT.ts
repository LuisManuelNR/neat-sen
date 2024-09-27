import { Brain } from './KAN'

export class Individuals {
	brain: Brain
	fitness: number = 0

	constructor(brain: Brain) {
		this.brain = brain
	}

	mutate(mutationRate: number): void {
		this.brain.mutate(0.1, 0.5, 0.05)
	}
}

type FixedLengthArray<T, L extends number> = {
	length: L
} & Array<T>

type NEATOptions<T extends Individuals, I extends number, O extends number> = {
	inputDim: I
	outputDim: O
	populationSize: number
	mutationRate?: number
	mutationChange?: number
	createIndividual: (brain: Brain) => T
}

export class NEAT<T extends Individuals, I extends number, O extends number> {
	population: T[]
	#mutationRate: number
	#populationSize: number
	#generation: number = 0
	#createIndividual: (brain: Brain) => T

	constructor(opt: NEATOptions<T, I, O>) {
		this.#mutationRate = opt.mutationRate || 0.3
		this.#populationSize = opt.populationSize
		this.#createIndividual = opt.createIndividual
		this.population = []

		for (let i = 0; i < this.#populationSize; i++) {
			const network = new Brain(opt.inputDim, opt.outputDim, 7, 4)
			this.population.push(this.#createIndividual(network))
		}
	}

	evolve() {
		this.#generation++
		this.#normalizeFitness()
		this.#selection()
		// this.#reproduce()
		this.#mutatePopulation()
	}

	#normalizeFitness() {
		// Hacemos el cálculo del fitness elevado al cuadrado y la suma en un solo reduce
		const sum = this.population.reduce((acc, individual) => {
			individual.fitness = Math.pow(individual.fitness, 2)
			return acc + individual.fitness
		}, 0)

		// Normalizamos dividiendo por la suma total
		this.population.forEach((individual) => {
			individual.fitness /= sum
		})
	}

	#selection() {
		// Preservar los mejores individuos (elitismo)
		const elitismCount = Math.floor(0.1 * this.#populationSize) // 10% de la población no será mutada
		this.population.sort((a, b) => b.fitness - a.fitness)

		// Mantener el elitismo y luego realizar la selección normal para el resto
		const elitists = this.population.slice(0, elitismCount)
		const rest = this.population.slice(elitismCount, this.#populationSize)

		// Selección por ranking para el resto de la población
		const selected = []
		while (selected.length < this.#populationSize - elitismCount) {
			const parentA = this.#selectByRank(rest)
			const parentB = this.#selectByRank(rest)

			// Evitar que los padres sean idénticos
			if (parentA !== parentB) {
				const childBrain = Brain.crossover(parentA.brain, parentB.brain)
				const child = this.#createIndividual(childBrain)
				selected.push(child)
			}
		}

		this.population = [...elitists, ...selected]
	}

	#mutatePopulation() {
		// Preservar un porcentaje de la población para elitismo
		const elitismCount = Math.floor(0.1 * this.#populationSize)
		for (let i = elitismCount; i < this.population.length; i++) {
			this.population[i].mutate(0.3)
		}
	}

	#selectRandomIndividual() {
		return this.population[Math.floor(Math.random() * this.population.length)]
	}

	#selectByRank(populationSubset: T[]) {
		const rankSum = (populationSubset.length * (populationSubset.length + 1)) / 2 // Suma de los ranks
		let randomValue = Math.random() * rankSum

		for (let i = 0; i < populationSubset.length; i++) {
			randomValue -= i + 1 // Restar el rank actual
			if (randomValue <= 0) {
				return populationSubset[i]
			}
		}
		return populationSubset[0] // Retorno por defecto si algo falla
	}

	getBestIndividual() {
		return this.population[0]
	}

	getGeneration(): number {
		return this.#generation
	}
}
