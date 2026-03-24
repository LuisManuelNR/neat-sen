import { clamp, linspace, random, randomGaussian, randomIndex, sum } from '$lib/utils'
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
		const s = sum(xs)
		this.value = Math.tanh(s)
	}
}
const knots = [
	0, 0, 0, 0,
	0.5,
	1, 1, 1, 1
]

function findSpan(t: number, degree: number, knots: number[]) {
	let low = degree
	let high = knots.length - degree - 1

	while (low <= high) {
		const mid = (low + high) >> 1

		if (t >= knots[mid] && t < knots[mid + 1]) {
			return mid
		} else if (t < knots[mid]) {
			high = mid - 1
		} else {
			low = mid + 1
		}
	}

	return knots.length - degree - 2
}

export class BSpline implements CellEdge {
	value = 0
	degree = 3

	p: number[] = Array(20)
		.fill(0)
		.map(() => Math.random())

	// evalúa basis functions N_i,k(t)
	private basisFunctions(span: number, t: number) {
		const k = this.degree
		const N = Array(k + 1).fill(0)

		const left = Array(k + 1).fill(0)
		const right = Array(k + 1).fill(0)

		N[0] = 1

		for (let j = 1; j <= k; j++) {
			left[j] = t - knots[span + 1 - j]
			right[j] = knots[span + j] - t

			let saved = 0

			for (let r = 0; r < j; r++) {
				const denom = right[r + 1] + left[j - r]

				const temp = denom === 0 ? 0 : N[r] / denom

				N[r] = saved + right[r + 1] * temp
				saved = left[j - r] * temp
			}

			N[j] = saved
		}

		return N
	}

	evaluate(x: number) {
		// clamp robusto
		const t = clamp(x, knots[0], knots[knots.length - 1] - 1e-12)

		const k = this.degree
		const span = findSpan(t, k, knots)

		const N = this.basisFunctions(span, t)

		let result = 0

		for (let j = 0; j <= k; j++) {
			const idx = span - k + j

			if (idx < 0 || idx >= this.p.length) {
				continue
			}

			result += this.p[idx] * N[j]
		}

		this.value = result
	}

	mutate(): void {
		const i = randomIndex(this.p)

		// mezcla exploración + explotación
		if (Math.random() < 0.01) {
			this.p[i] = Math.random()
		} else {
			this.p[i] += randomGaussian(0, 0.01)
			this.p[i] = clamp(this.p[i], 0, 1)
		}
	}

	split(): [BSpline, BSpline] {
		const b1 = new BSpline()
		const b2 = new BSpline()

		b1.p = this.p.map(v => v * Math.random())
		b2.p = this.p.map((v, i) => v - b1.p[i])

		return [b1, b2]
	}
}