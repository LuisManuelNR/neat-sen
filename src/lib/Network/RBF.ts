import { clamp, linspace, randomGaussian } from '$lib/utils'
import { randomNumber } from '@chasi/ui/utils'

export class RBF {
	center: number
	sigma: number
	weight: number
	domain: [number, number]

	constructor(arg: [number, number] | RBF) {
		if (arg instanceof RBF) {
			this.domain = arg.domain
			this.center = arg.center
			this.weight = arg.weight
			this.sigma = arg.sigma
		} else {
			this.domain = arg
			this.center = randomNumber(this.domain[0], this.domain[1])
			this.weight = randomNumber(this.domain[0], this.domain[1])
			this.sigma = randomNumber(0.001, 0.9)
		}
	}

	plot(resolution = 100) {
		const x = linspace(0, 1, resolution)
		const y = x.map((v) => this.evaluate(v))
		return { x, y }
	}

	evaluate(x: number): number {
		const gauss = Math.exp(-((x - this.center) ** 2) / (2 * this.sigma ** 2))
		return gauss * this.weight
	}

	mutate() {
		const mutationRate = 0.3 // Probabilidad de mutar cada parámetro
		const mutationMagnitude = 0.01 // Magnitud máxima de la perturbación

		if (Math.random() < mutationRate) {
			this.center += randomGaussian(0, mutationMagnitude)
			// Asegurarse de que el centro quede en el intervalo [0, 1]
			this.center = clamp(this.center, this.domain[0], this.domain[1])
			this.weight += randomGaussian(0, mutationMagnitude)
			this.weight = clamp(this.weight, this.domain[0], this.domain[1])
			this.sigma += randomGaussian(0, mutationMagnitude)
			this.sigma = clamp(this.sigma, 0.001, 0.9)
		}
	}

	clone(): RBF {
		return new RBF(this)
	}
}
