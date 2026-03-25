import {
	clamp,
	linspace,
	random,
	randomGaussian,
	randomIndex,
	relu,
	sigmoid,
	sum
} from '$lib/utils'
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
		this.value = s / xs.length
	}
}

export class BSpline implements CellEdge {
	value = 0
	degree = 3

	p: number[] = Array(20).fill(0).map(Math.random)

	constructor(public knots = createUniformKnots(this.p.length, this.degree)) {}

	private basisFunctions(span: number, t: number) {
		const k = this.degree
		const N = Array(k + 1).fill(0)

		const left = Array(k + 1).fill(0)
		const right = Array(k + 1).fill(0)

		N[0] = 1

		for (let j = 1; j <= k; j++) {
			left[j] = t - this.knots[span + 1 - j]
			right[j] = this.knots[span + j] - t

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
		const t = clamp(x, this.knots[0], this.knots[this.knots.length - 1] - 1e-12)

		const k = this.degree
		const span = findSpan(t, k, this.knots)
		const N = this.basisFunctions(span, t)

		let result = 0

		for (let j = 0; j <= k; j++) {
			const idx = span - k + j

			if (idx < 0 || idx >= this.p.length) {
				throw new Error('Invalid B-spline configuration')
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
			this.p[i] += randomGaussian(0, 0.03)
			this.p[i] = clamp(this.p[i], 0, 1)
		}
	}

	split(): [BSpline, BSpline] {
		const b1 = new BSpline(this.knots)
		const b2 = new BSpline(this.knots)

		b1.p = this.p.map((v) => v * Math.random())
		b2.p = this.p.map((v, i) => v - b1.p[i])

		return [b1, b2]
	}
}

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

function createUniformKnots(numControlPoints: number, degree: number): number[] {
	const n = numControlPoints - 1
	const m = n + degree + 1

	const knots: number[] = []

	// extremos (clamped)
	for (let i = 0; i <= degree; i++) {
		knots.push(0)
	}

	const interiorCount = m - 2 * (degree + 1) + 1

	for (let i = 1; i < interiorCount; i++) {
		knots.push(i / interiorCount)
	}

	for (let i = 0; i <= degree; i++) {
		knots.push(1)
	}

	return knots
}

function createRandomKnots(numControlPoints: number, degree: number): number[] {
	const n = numControlPoints - 1
	const m = n + degree + 1

	const knots: number[] = []

	// extremos
	for (let i = 0; i <= degree; i++) {
		knots.push(0)
	}

	const interiorCount = m - 2 * (degree + 1) + 1

	// generar interiores ordenados
	const interior: number[] = []
	for (let i = 0; i < interiorCount - 1; i++) {
		interior.push(Math.random())
	}

	interior.sort((a, b) => a - b)

	knots.push(...interior)

	// extremos finales
	for (let i = 0; i <= degree; i++) {
		knots.push(1)
	}

	return knots
}

function mutateKnots(knots: number[], degree: number, sigma = 0.05): number[] {
	const newKnots = [...knots]

	const start = degree + 1
	const end = knots.length - degree - 1

	for (let i = start; i < end; i++) {
		newKnots[i] += randomGaussian(0, sigma)
	}

	// mantener orden
	const interior = newKnots.slice(start, end).sort((a, b) => a - b)

	for (let i = start; i < end; i++) {
		newKnots[i] = clamp(interior[i - start], 0, 1)
	}

	return newKnots
}
