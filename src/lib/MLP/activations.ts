export function LOGISTIC(x: number, derivate?: boolean): number {
	const fx = 1 / (1 + Math.exp(-x))
	if (!derivate) return fx
	return fx * (1 - fx)
}

export function TANH(x: number, derivate?: boolean): number {
	if (derivate) return 1 - Math.pow(Math.tanh(x), 2)
	return Math.tanh(x)
}

export function IDENTITY(x: number, derivate?: boolean): number {
	return derivate ? 1 : x
}

export function STEP(x: number, derivate?: boolean): number {
	return derivate ? 0 : x > 0 ? 1 : 0
}

export function RELU(x: number, derivate?: boolean): number {
	if (derivate) return x > 0 ? 1 : 0
	return x > 0 ? x : 0
}

export function SOFTSIGN(x: number, derivate?: boolean): number {
	const d = 1 + Math.abs(x)
	if (derivate) return x / Math.pow(d, 2)
	return x / d
}

export function SINUSOID(x: number, derivate?: boolean): number {
	if (derivate) return Math.cos(x)
	return Math.sin(x)
}

export function GAUSSIAN(x: number, derivate?: boolean): number {
	const d = Math.exp(-Math.pow(x, 2))
	if (derivate) return -2 * x * d
	return d
}

export function BENT_IDENTITY(x: number, derivate?: boolean): number {
	const d = Math.sqrt(Math.pow(x, 2) + 1)
	if (derivate) return x / (2 * d) + 1
	return (d - 1) / 2 + x
}

export function BIPOLAR(x: number, derivate?: boolean): number {
	return derivate ? 0 : x > 0 ? 1 : -1
}

export function BIPOLAR_SIGMOID(x: number, derivate?: boolean): number {
	const d = 2 / (1 + Math.exp(-x)) - 1
	if (derivate) return (1 / 2) * (1 + d) * (1 - d)
	return d
}

export function HARD_TANH(x: number, derivate?: boolean): number {
	if (derivate) return x > -1 && x < 1 ? 1 : 0
	return Math.max(-1, Math.min(1, x))
}

export function ABSOLUTE(x: number, derivate?: boolean): number {
	if (derivate) return x < 0 ? -1 : 1
	return Math.abs(x)
}

export function INVERSE(x: number, derivate?: boolean): number {
	if (derivate) return -1
	return 1 - x
}

export function SELU(x: number, derivate?: boolean): number {
	const alpha = 1.6732632423543772848170429916717
	const scale = 1.0507009873554804934193349852946
	const fx = x > 0 ? x : alpha * Math.exp(x) - alpha
	if (derivate) return x > 0 ? scale : (fx + alpha) * scale
	return fx * scale
}
