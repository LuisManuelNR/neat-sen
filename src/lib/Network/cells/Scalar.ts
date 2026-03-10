import { randomGaussian } from '$lib/utils'
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
		this.value = x
	}
	mutate(): void { }
}

export class BSpline implements Cell {
	value: number = 0

	// cubic B-spline parameters
	a = Math.random() * 2 - 1
	b = Math.random() * 2 - 1
	c = Math.random() * 2 - 1
	d = Math.random() * 2 - 1

	evaluate(x: number) {
		const x2 = x * x
		const x3 = x2 * x

		this.value =
			this.a * (-x3 + 3 * x2 - 3 * x + 1) / 6 +
			this.b * (3 * x3 - 6 * x2 + 4) / 6 +
			this.c * (-3 * x3 + 3 * x2 + 3 * x + 1) / 6 +
			this.d * x3 / 6
	}

	mutate(): void {
		this.a += randomGaussian(0, 0.1)
		this.b += randomGaussian(0, 0.1)
		this.c += randomGaussian(0, 0.1)
		this.d += randomGaussian(0, 0.1)
	}
}

export class Radial implements Cell {
	value: number = 0

	center = Math.random() * 2 - 1
	width = Math.random() + 0.1

	evaluate(x: number) {
		const d = x - this.center
		this.value = Math.exp(-(d * d) / (2 * this.width * this.width))
	}

	mutate(): void {
		this.center += randomGaussian(0, 0.1)
		this.width = Math.max(0.01, this.width + randomGaussian(0, 0.05))
	}
}

export class ArcCosine implements Cell {
	value: number = 0

	order = Math.floor(Math.random() * 3) // 0,1,2

	evaluate(x: number) {
		const clamped = Math.max(-1, Math.min(1, x))
		const theta = Math.acos(clamped)

		switch (this.order) {
			case 0:
				this.value = Math.PI - theta
				break
			case 1:
				this.value = clamped * (Math.PI - theta) + Math.sqrt(1 - clamped * clamped)
				break
			case 2:
				this.value =
					(3 * clamped * clamped - 1) * (Math.PI - theta) +
					3 * clamped * Math.sqrt(1 - clamped * clamped)
				break
		}
	}

	mutate(): void {
		if (Math.random() < 0.2) {
			this.order = Math.floor(Math.random() * 3)
		}
	}
}

export class Sine implements Cell {
	value: number = 0

	freq = Math.random() * 2
	phase = Math.random() * Math.PI * 2
	amp = Math.random()

	evaluate(x: number) {
		this.value = this.amp * Math.sin(this.freq * x + this.phase)
	}

	mutate(): void {
		this.freq += randomGaussian(0, 0.1)
		this.phase += randomGaussian(0, 0.1)
		this.amp += randomGaussian(0, 0.05)
	}
}

export class Cosine implements Cell {
	value: number = 0

	freq = Math.random() * 2
	phase = Math.random() * Math.PI * 2
	amp = Math.random()

	evaluate(x: number) {
		this.value = this.amp * Math.cos(this.freq * x + this.phase)
	}

	mutate(): void {
		this.freq += randomGaussian(0, 0.1)
		this.phase += randomGaussian(0, 0.1)
		this.amp += randomGaussian(0, 0.05)
	}
}

export class ClampCell implements Cell {
	value: number = 0

	min = -1
	max = 1

	evaluate(x: number) {
		this.value = Math.max(this.min, Math.min(this.max, x))
	}

	mutate(): void {
		this.min += randomGaussian(0, 0.05)
		this.max += randomGaussian(0, 0.05)

		if (this.min > this.max) {
			const t = this.min
			this.min = this.max
			this.max = t
		}
	}
}

export class TanhCell implements Cell {
	value: number = 0

	gain = 1

	evaluate(x: number) {
		this.value = Math.tanh(x * this.gain)
	}

	mutate(): void {
		this.gain += randomGaussian(0, 0.1)
	}
}

export class Softsign implements Cell {
	value: number = 0

	scale = 1

	evaluate(x: number) {
		const v = x * this.scale
		this.value = v / (1 + Math.abs(v))
	}

	mutate(): void {
		this.scale += randomGaussian(0, 0.1)
	}
}