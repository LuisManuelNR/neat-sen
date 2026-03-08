import { randomNumber } from '@chasi/ui/utils'
import { clamp, randomGaussian, sum } from '$lib/utils'
import type { Cell } from '../Brain'

// radial basis node
export class Radial implements Cell {
	value: number = 0
	center = Math.random()
	weight = Math.random()
	sigma = randomNumber(0.001, 0.9)

	constructor(center?: number, weight?: number, sigma?: number) {
		this.center = center || Math.random()
		this.weight = weight || Math.random()
		this.sigma = sigma || randomNumber(0.001, 0.9)
	}

	evaluate(x: number) {
		const gauss = Math.exp(-((x - this.center) ** 2) / (2 * this.sigma ** 2))
		this.value = gauss * this.weight
	}
	mutate(): void {
		const mutationMagnitude = 0.1 // Magnitud máxima de la perturbación

		this.center += randomGaussian(0, mutationMagnitude)
		this.weight += randomGaussian(0, mutationMagnitude)
		this.sigma += randomGaussian(0, mutationMagnitude)
		this.sigma = clamp(this.sigma, 0.001, 0.9)
	}
}
