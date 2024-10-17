import { Brain } from '$lib/KAN/Brain'

export class Genome {
	brain: Brain
	fitness = 0
	inputs: number[]
	outputs: number[]
	constructor(inputs: number, outputs: number) {
		this.brain = new Brain(inputs, outputs)
		this.inputs = new Array(inputs).fill(0)
		this.outputs = new Array(outputs).fill(0)
	}

	train() {}

	predict() {}
}

export type CreateFunction<T> = () => T

export type FitnessSort = 'max' | 'min'
export class Simulation<T extends Genome> {
	population: T[]
	#populationSize: number
	#generation: number = 0
	#create: CreateFunction<T>
	#fitnessSort: FitnessSort

	constructor(populationSize: number, create: CreateFunction<T>, fitnessSort?: FitnessSort) {
		this.#populationSize = populationSize
		this.population = []
		this.#create = create
		this.#fitnessSort = fitnessSort || 'max'

		// Inicialización de la población
		for (let i = 0; i < this.#populationSize; i++) {
			this.population.push(this.#create())
		}
	}

	evolve() {
		this.#generation++
		this.#selection() // Seleccionar los mejores individuos y mutar
	}

	#normalizeFitness(group: T[]) {
		const sum = group.reduce((total, indi) => total + indi.fitness, 0)
		group.forEach((indi) => {
			indi.fitness /= sum
		})
	}

	#selection() {
		if (this.#fitnessSort === 'max') {
			this.population.sort((a, b) => b.fitness - a.fitness)
		} else {
			this.population.sort((a, b) => a.fitness - b.fitness)
		}

		// nos quedamos con la mitad
		const half = this.population.slice(0, Math.round(this.#populationSize / 2))

		// Calcula el número de elitistas
		const elitistas = Math.floor(0.1 * half.length)

		// Selecciona los elitistas
		const elitists = half.slice(0, elitistas).map((a) => {
			const elitist = this.#create()
			elitist.brain = a.brain.clone()
			return elitist
		})

		// El resto de la población, excluyendo elitistas
		const rest = half.slice(elitistas)
		this.#normalizeFitness(rest)

		const selected = this.#stochasticUniversalSampling(rest, this.#populationSize - elitistas)

		// Actualiza la población combinando elitistas, seleccionados y nuevos individuos
		this.population = [...elitists, ...selected]
	}

	#stochasticUniversalSampling(group: T[], numToSelect: number): T[] {
		const selected: T[] = []

		// Calcular el intervalo de selección
		const interval = 1 / numToSelect
		let startPoint = Math.random() * interval
		let accumulatedFitness = 0
		let index = 0

		// Seleccionar individuos equiespaciados en el fitness acumulativo
		for (let i = 0; i < numToSelect; i++) {
			const target = startPoint + i * interval
			while (accumulatedFitness < target && index < group.length) {
				accumulatedFitness += group[index].fitness
				index++
			}

			// Ajustar índice para que sea válido
			index = Math.max(0, index - 1)

			// Crear un nuevo individuo desde el seleccionado y aplicar mutación
			const winner = this.#create()
			winner.brain = group[index].brain.clone()
			winner.brain.mutate()
			selected.push(winner)
		}
		return selected
	}
	// Obtener la generación actual
	getGeneration(): number {
		return this.#generation
	}
}
