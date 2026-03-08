import { randomGaussian } from '$lib/utils'
import type { Cell } from '../Brain'

export class Scalar implements Cell {
	value: number = 0
	weight: number
	constructor({ weight }: { weight?: number } = {}) {
		this.weight = weight || Math.random()
	}
	evaluate(x: number) {
		this.value = x * this.weight
	}
	mutate(): void {
		this.weight += randomGaussian(0, 0.1)
	}
}
