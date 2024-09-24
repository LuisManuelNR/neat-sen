import { KANNetwork } from './Kan'
import { Spline } from './Spline'

export class Genome {
	network: KANNetwork
	fitness: number = 0

	constructor(network: KANNetwork) {
		this.network = network
	}

	mutate(mutationRate: number): void {
		this.network.mutate(mutationRate)
	}

	// Método para cruzar dos genomas y generar un nuevo descendiente
	crossover(partner: Genome): KANNetwork {
		const childNetwork = this.network.clone()

		// Cruzar coeficientes
		for (let i = 0; i < this.network.coefficients.length; i++) {
			for (let j = 0; j < this.network.coefficients[i].length; j++) {
				// Tomamos el coeficiente de uno u otro genoma de forma aleatoria
				childNetwork.coefficients[i][j] =
					Math.random() > 0.5 ? this.network.coefficients[i][j] : partner.network.coefficients[i][j]
			}
		}

		// Cruzar splines
		for (let i = 0; i < this.network.splines.length; i++) {
			for (let j = 0; j < this.network.splines[i].length; j++) {
				// Para los splines, clonamos el spline de uno u otro genoma aleatoriamente
				childNetwork.splines[i][j] =
					Math.random() > 0.5
						? new Spline([...this.network.splines[i][j].controlPoints])
						: new Spline([...partner.network.splines[i][j].controlPoints])
			}
		}

		return childNetwork
	}
}

export class NEAT<T extends Genome> {
	#population: T[]
	#mutationRate: number
	#populationSize: number
	#generation: number = 0
	#fitnessFunction: (network: T) => number
	#createIndividual: (network: KANNetwork) => T

	constructor(
		inputDim: number,
		numFunctions: number,
		outputDim: number,
		populationSize: number,
		mutationRate: number,
		fitnessFunction: (network: T) => number,
		createIndividual: (network: KANNetwork) => T
	) {
		this.#mutationRate = mutationRate
		this.#populationSize = populationSize
		this.#fitnessFunction = fitnessFunction
		this.#createIndividual = createIndividual
		this.#population = this.#initializePopulation(inputDim, numFunctions, outputDim)
	}

	#initializePopulation(inputDim: number, numFunctions: number, outputDim: number): T[] {
		const population: T[] = []
		for (let i = 0; i < this.#populationSize; i++) {
			const network = new KANNetwork(inputDim, numFunctions, outputDim)
			population.push(this.#createIndividual(network))
		}
		return population
	}

	evolve() {
		this.#generation++
		this.#evaluateFitness()
		this.#selection()
		this.#reproduce()
		this.#mutatePopulation()
	}

	#evaluateFitness() {
		// Usar la función de fitness proporcionada para evaluar la aptitud de cada genoma
		for (const genome of this.#population) {
			genome.fitness = this.#fitnessFunction(genome)
		}
	}

	#selection() {
		// Seleccionar los mejores genomas (algún tipo de selección, por ejemplo elitismo o torneo)
		this.#population.sort((a, b) => b.fitness - a.fitness)
		this.#population = this.#population.slice(0, this.#populationSize) // Mantener los mejores
	}

	#reproduce() {
		const newPopulation: T[] = []
		for (let i = 0; i < this.#populationSize; i++) {
			const parentA = this.#selectByRank()
			const parentB = this.#selectByRank()
			const childBrain = parentA.crossover(parentB)
			const child = this.#createIndividual(childBrain)
			newPopulation.push(child)
		}
		this.#population = newPopulation
	}

	#mutatePopulation() {
		for (const genome of this.#population) {
			genome.mutate(this.#mutationRate)
		}
	}

	// #selectRandomGenome(): Genome {
	// 	return this.#population[Math.floor(Math.random() * this.#population.length)]
	// }

	#selectByRank(): T {
		const rankSum = (this.#population.length * (this.#population.length + 1)) / 2 // Suma de los ranks
		let randomValue = Math.random() * rankSum

		for (let i = 0; i < this.#population.length; i++) {
			randomValue -= i + 1 // Restar el rank actual
			if (randomValue <= 0) {
				return this.#population[i]
			}
		}
		return this.#population[0] // Retorno por defecto si algo falla
	}

	getBestGenome(): T {
		return this.#population[0] // Mejor genoma según fitness
	}

	getGeneration(): number {
		return this.#generation
	}
}
