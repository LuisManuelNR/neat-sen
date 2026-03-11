import { clamp, randomGaussian, randomIndex } from '$lib/utils'
import type { Cell } from '../Brain'

export class Scalar implements Cell {
	value: number = 0
	weight = Math.random()
	evaluate(x: number) {
		this.value = x * this.weight
	}
	mutate(): void {
		this.weight += randomGaussian(0, 0.1)
	}
}

export class Identity implements Cell {
	value: number = 0
	evaluate(x: number) {
		this.value = x / (1 + Math.abs(x))
	}
	mutate(): void {}
}

export class BSpline implements Cell {
	value = 0
	p = Array(5)
		.fill(0)
		.map((p) => (Math.random() * 2 - 1) * 0.8)

	evaluate(x: number) {
		const x2 = x * x
		const x3 = x2 * x
		const x4 = x3 * x

		const r =
			this.p[0] * (x4 / 24 - x3 / 6 + x2 / 4 - x / 6 + 1 / 24) +
			this.p[1] * (-x4 / 6 + x3 / 2 - x2 / 4 - x / 2 + 11 / 24) +
			this.p[2] * (x4 / 4 - x3 / 2 - x2 / 4 + x / 2 + 11 / 24) +
			this.p[3] * (-x4 / 6 + x3 / 6 + x2 / 4 + x / 6 + 1 / 24) +
			this.p[4] * (x4 / 24)
		this.value = r
	}

	mutate(): void {
		// const mutationMagnitude = 0.01
		const rp = randomIndex(this.p)
		this.p[rp] += (Math.random() * 2 - 1) * 0.1
		this.p[rp] = clamp(this.p[rp], -1, 1)
	}
}
