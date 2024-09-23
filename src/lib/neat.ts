// Definimos los tipos para los individuos y la función de aptitud
type Individual = any // Esto puede cambiar según tu implementación
type FitnessFunction = (individual: Individual) => number

interface NEATOptions {
  populationSize: number
  mutationRate: number
  crossoverRate: number
  generations: number
  elitism: boolean
  fitnessFunction: FitnessFunction
  generateIndividual: () => Individual
  mutate: (individual: Individual) => Individual
  crossover: (parent1: Individual, parent2: Individual) => Individual[]
}

export class NEAT {
  #population: Individual[] = [];
  #options: NEATOptions

  constructor(options: NEATOptions) {
    this.#options = options
    this.#population = this.#generateInitialPopulation()
  }

  // Genera la población inicial
  #generateInitialPopulation(): Individual[] {
    return Array.from({ length: this.#options.populationSize }, this.#options.generateIndividual)
  }

  // Evaluación de la población
  #evaluatePopulation(): number[] {
    return this.#population.map(this.#options.fitnessFunction)
  }

  // Selección de individuos para reproducción (torneo binario)
  #selectIndividual(): Individual {
    const tournamentSize = 2
    const selected: Individual[] = []
    for (let i = 0; i < tournamentSize; i++) {
      selected.push(this.#population[Math.floor(Math.random() * this.#population.length)])
    }
    selected.sort((a, b) => this.#options.fitnessFunction(b) - this.#options.fitnessFunction(a))
    return selected[0]
  }

  // Proceso de crossover y mutación
  #reproduceAndMutate(): Individual[] {
    const newPopulation: Individual[] = []
    const eliteCount = this.#options.elitism ? 1 : 0

    if (this.#options.elitism) {
      const fitnessScores = this.#evaluatePopulation()
      const eliteIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
      newPopulation.push(this.#population[eliteIndex])
    }

    while (newPopulation.length < this.#options.populationSize) {
      const parent1 = this.#selectIndividual()
      const parent2 = this.#selectIndividual()

      let offspring: Individual[] = [parent1, parent2]

      // Crossover
      if (Math.random() < this.#options.crossoverRate) {
        offspring = this.#options.crossover(parent1, parent2)
      }

      // Mutación
      offspring = offspring.map(individual =>
        Math.random() < this.#options.mutationRate ? this.#options.mutate(individual) : individual
      )

      newPopulation.push(...offspring)
    }

    return newPopulation.slice(0, this.#options.populationSize)
  }

  // Ejecutar el algoritmo genético
  public run(): Individual {
    for (let generation = 0; generation < this.#options.generations; generation++) {
      this.#population = this.#reproduceAndMutate()
      const bestFitness = Math.max(...this.#evaluatePopulation())
      console.log(`Generación ${generation + 1}: Mejor aptitud = ${bestFitness}`)
    }

    // Devolver el mejor individuo
    const fitnessScores = this.#evaluatePopulation()
    const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
    return this.#population[bestIndex]
  }
}
