import { clamp, randomGaussian, randomIndex, sum } from '$lib/utils'
import type { CellEdge, CellNode } from '../Brain'

export class Clock implements CellNode {
	value: number = 0
	time = 0

	evaluate() {
		const cycle = 2 * Math.PI
		this.time = (this.time + 1) % cycle
		this.value = Math.sin(this.time)
		return this.value
	}
}

export class Sum implements CellNode {
	value: number = 0
	evaluate(xs: number[]) {
		this.value = stable(xs)
	}
}

export class BSpline implements CellEdge {
	value = 0
	p = Array(5)
		.fill(0)
		.map((p) => (Math.random() * 2 - 1) * 0.1)

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
		const magnitude = 0.01
		const rp = randomIndex(this.p)
		this.p[rp] += (Math.random() * 2 - 1) * magnitude
		this.p[rp] = clamp(this.p[rp], -1, 1)
	}

	split(): [BSpline, BSpline] {
		const b1 = new BSpline()
		const b2 = new BSpline()
		b1.p = this.p.map((val) => {
			const r = Math.random() // fracción aleatoria
			return val * r
		})
		b2.p = b1.p.map((val, i) => val - b1.p[i])
		return [b1, b2]
	}
}

function stable(inputs: number[]): number {
	let sum = 0
	let norm = 0

	for (const x of inputs) {
		sum += x
		norm += Math.abs(x)
	}

	if (norm === 0) return 0
	return sum / norm
}
