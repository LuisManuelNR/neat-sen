import { Brain } from '../NN/MLP'

export class Genome {
	network: Brain
	fitness: number = 0

	constructor(network: Brain) {
		this.network = network
	}

	mutate() {
		this.network.mutate()
	}
}

export class NEAT<T extends Genome> {
	population: T[]
	#populationSize: number
	#generation: number = 0
	#createIndividual: (network: Brain) => T

	constructor(
		inputDim: number,
		outputDim: number,
		populationSize: number,
		createIndividual: (network: Brain) => T
	) {
		this.#populationSize = populationSize
		this.#createIndividual = createIndividual
		this.population = this.#initializePopulation(inputDim, outputDim)
	}

	#initializePopulation(inputDim: number, outputDim: number): T[] {
		const population: T[] = []
		for (let i = 0; i < this.#populationSize; i++) {
			const network = new Brain(inputDim, outputDim)
			population.push(this.#createIndividual(network))
		}
		return population
	}

	evolve() {
		this.#generation++
		this.#selection()
		this.#reproduce()
		this.#mutatePopulation()
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
				const childBrain = parentA.network.crossover(parentB.network)
				const child = this.#createIndividual(childBrain)
				selected.push(child)
			}
		}

		this.population = [...elitists, ...selected]
	}

	#reproduce() {
		const newPopulation: T[] = []
		for (let i = 0; i < this.#populationSize; i++) {
			const parentA = this.#selectRandomGenome()
			const parentB = this.#selectRandomGenome()
			const childBrain = parentA.network.crossover(parentB.network)
			const child = this.#createIndividual(childBrain)
			newPopulation.push(child)
		}
		this.population = newPopulation
	}

	#mutatePopulation() {
		// Preservar un porcentaje de la población para elitismo
		const elitismCount = Math.floor(0.1 * this.#populationSize)
		for (let i = elitismCount; i < this.population.length; i++) {
			this.population[i].mutate()
		}
	}

	#selectRandomGenome(): Genome {
		return this.population[Math.floor(Math.random() * this.population.length)]
	}

	#selectByRank(populationSubset: T[]): T {
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

	getBestGenome(): T {
		return this.population.toSorted((a, b) => b.fitness - a.fitness)[0]
	}

	getGeneration(): number {
		return this.#generation
	}
}
