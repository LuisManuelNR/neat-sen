import { Network } from './network'

const selection = {
	FITNESS_PROPORTIONATE: {
		name: 'FITNESS_PROPORTIONATE'
	},
	POWER: {
		name: 'POWER',
		power: 4
	},
	TOURNAMENT: {
		name: 'TOURNAMENT',
		size: 5,
		probability: 0.5
	}
} as const

const crossover = {
	SINGLE_POINT: {
		name: 'SINGLE_POINT',
		config: [0.4]
	},
	TWO_POINT: {
		name: 'TWO_POINT',
		config: [0.4, 0.9]
	},
	UNIFORM: {
		name: 'UNIFORM'
	},
	AVERAGE: {
		name: 'AVERAGE'
	}
} as const

const mutation = {
	ADD_NODE: {
		name: 'ADD_NODE'
	},
	SUB_NODE: {
		name: 'SUB_NODE',
		keep_gates: true
	},
	ADD_CONN: {
		name: 'ADD_CONN'
	},
	SUB_CONN: {
		name: 'REMOVE_CONN'
	},
	MOD_WEIGHT: {
		name: 'MOD_WEIGHT',
		min: -1,
		max: 1
	},
	MOD_BIAS: {
		name: 'MOD_BIAS',
		min: -1,
		max: 1
	},
	MOD_ACTIVATION: {
		name: 'MOD_ACTIVATION',
		mutateOutput: true,
		allowed: [
			activation.LOGISTIC,
			activation.TANH,
			activation.RELU,
			activation.IDENTITY,
			activation.STEP,
			activation.SOFTSIGN,
			activation.SINUSOID,
			activation.GAUSSIAN,
			activation.BENT_IDENTITY,
			activation.BIPOLAR,
			activation.BIPOLAR_SIGMOID,
			activation.HARD_TANH,
			activation.ABSOLUTE,
			activation.INVERSE,
			activation.SELU
		]
	},
	ADD_SELF_CONN: {
		name: 'ADD_SELF_CONN'
	},
	SUB_SELF_CONN: {
		name: 'SUB_SELF_CONN'
	},
	ADD_GATE: {
		name: 'ADD_GATE'
	},
	SUB_GATE: {
		name: 'SUB_GATE'
	},
	ADD_BACK_CONN: {
		name: 'ADD_BACK_CONN'
	},
	SUB_BACK_CONN: {
		name: 'SUB_BACK_CONN'
	},
	SWAP_NODES: {
		name: 'SWAP_NODES',
		mutateOutput: true
	},
	FFW: [
		mutation.ADD_NODE,
		mutation.SUB_NODE,
		mutation.ADD_CONN,
		mutation.SUB_CONN,
		mutation.MOD_WEIGHT,
		mutation.MOD_BIAS,
		mutation.MOD_ACTIVATION,
		mutation.SWAP_NODES
	]
} as const

export class Neat {
	input: number
	output: number
	fitness: (population: Network[] | Network) => Promise<void>
	equal: boolean
	clear: boolean
	popsize: number
	elitism: number
	provenance: number
	mutationRate: number
	mutationAmount: number
	fitnessPopulation: boolean
	selection: any
	crossover: any
	mutation: any
	template: Network | false
	maxNodes: number
	maxConns: number
	maxGates: number
	generation: number
	population: Network[]

	constructor(
		input: number,
		output: number,
		fitness: (population: Network[] | Network) => Promise<void>,
		options: any = {}
	) {
		this.input = input
		this.output = output
		this.fitness = fitness

		this.equal = options.equal || false
		this.clear = options.clear || false
		this.popsize = options.popsize || 50
		this.elitism = options.elitism || 0
		this.provenance = options.provenance || 0
		this.mutationRate = options.mutationRate || 0.3
		this.mutationAmount = options.mutationAmount || 1
		this.fitnessPopulation = options.fitnessPopulation || false
		this.selection = options.selection || selection.POWER
		this.crossover = options.crossover || [
			crossover.SINGLE_POINT,
			crossover.TWO_POINT,
			crossover.UNIFORM,
			crossover.AVERAGE
		]
		this.mutation = options.mutation || mutation.FFW
		this.template = options.network || false
		this.maxNodes = options.maxNodes || Infinity
		this.maxConns = options.maxConns || Infinity
		this.maxGates = options.maxGates || Infinity

		this.generation = 0

		this.createPool(this.template)
	}

	createPool(network?: Network | false): void {
		this.population = []
		for (let i = 0; i < this.popsize; i++) {
			const copy = network ? Network.fromJSON(network.toJSON()) : new Network(this.input, this.output)
			copy.score = undefined
			this.population.push(copy)
		}
	}

	async evolve(): Promise<Network> {
		if (this.population[this.population.length - 1].score === undefined) {
			await this.evaluate()
		}
		this.sort()
		const fittest = Network.fromJSON(this.population[0].toJSON())
		fittest.score = this.population[0].score
		const newPopulation: Network[] = []

		// Elitism
		for (let i = 0; i < this.elitism; i++) {
			newPopulation.push(this.population[i])
		}

		for (let i = 0; i < this.provenance; i++) {
			newPopulation.push(Network.fromJSON(this.template!.toJSON()))
		}

		// Breed new individuals
		for (let i = 0; i < this.popsize - this.elitism - this.provenance; i++) {
			newPopulation.push(this.getOffspring())
		}

		this.population = newPopulation
		this.mutate()
		this.generation++
		return fittest
	}

	getOffspring(): Network {
		const parent1 = this.getParent()
		const parent2 = this.getParent()
		return Network.crossOver(parent1, parent2, this.equal)
	}

	mutate(): void {
		// Elitist genomes should not be mutated
		for (const genome of this.population) {
			if (Math.random() <= this.mutationRate) {
				for (let j = 0; j < this.mutationAmount; j++) {
					const mutationMethod = this.selectMutationMethod(genome)
					genome.mutate(mutationMethod)
				}
			}
		}
	}

	async evaluate(): Promise<void> {
		if (this.fitnessPopulation) {
			if (this.clear) {
				for (const genome of this.population) {
					genome.clear()
				}
			}
			await this.fitness(this.population)
		} else {
			for (const genome of this.population) {
				if (this.clear) genome.clear()
				genome.score = await this.fitness(genome)
			}
		}
	}

	sort(): void {
		this.population.sort((a, b) => b.score - a.score)
	}

	getFittest(): Network {
		if (this.population[this.population.length - 1].score === undefined) {
			this.evaluate()
		}

		if (this.population[0].score < this.population[1].score) {
			this.sort()
		}

		return this.population[0]
	}

	getAverage(): number {
		if (this.population[this.population.length - 1].score === undefined) {
			this.evaluate()
		}

		let totalScore = 0
		for (const genome of this.population) {
			totalScore += genome.score
		}

		return totalScore / this.population.length
	}

	getParent(): Network {
		switch (this.selection) {
			case selection.POWER:
				if (this.population[0].score < this.population[1].score) this.sort()
				const index = Math.floor(Math.pow(Math.random(), this.selection.power) * this.population.length)
				return this.population[index]

			case selection.FITNESS_PROPORTIONATE:
				let totalFitness = 0
				let minimalFitness = 0

				for (const genome of this.population) {
					minimalFitness = Math.min(minimalFitness, genome.score)
					totalFitness += genome.score
				}

				minimalFitness = Math.abs(minimalFitness)
				totalFitness += minimalFitness * this.population.length

				let random = Math.random() * totalFitness
				let cumulative = 0

				for (const genome of this.population) {
					cumulative += genome.score + minimalFitness
					if (random < cumulative) return genome
				}

				return this.population[Math.floor(Math.random() * this.population.length)]

			case selection.TOURNAMENT:
				if (this.selection.size > this.popsize) {
					throw new Error('Tournament size exceeds population size.')
				}

				const tournament: Network[] = []
				for (let i = 0; i < this.selection.size; i++) {
					tournament.push(this.population[Math.floor(Math.random() * this.population.length)])
				}

				tournament.sort((a, b) => b.score - a.score)

				for (let i = 0; i < this.selection.size; i++) {
					if (Math.random() < this.selection.probability || i === this.selection.size - 1) {
						return tournament[i]
					}
				}
		}
	}
}
