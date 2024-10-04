// Función Sigmoide
export function sigmoid(x: number) {
	return 1 / (1 + Math.exp(-x))
}

export function silu(x: number) {
	return x * sigmoid(x)
}

// Función Tangente Hiperbólica (tanh)
export function tanh(x: number) {
	return Math.tanh(x)
}

// Función ReLU (Rectified Linear Unit)
export function relu(x: number) {
	return Math.max(0, x)
}

// Función Softplus (suavizado de ReLU)
export function softplus(x: number) {
	return Math.log(1 + Math.exp(x))
}

// Función Softsign
export function softsign(x: number) {
	return x / (1 + Math.abs(x))
}

// Función de activación Lineal (sin cambios en la entrada)
export function linear(x: number) {
	return x
}

export function exponencial(x: number) {
	return Math.exp(x)
}

export function logaritmoNatural(x: number) {
	return Math.log(x)
}

export function seno(x: number) {
	return Math.sin(x)
}

export function coseno(x: number) {
	return Math.cos(x)
}

export function tangente(x: number) {
	return Math.tan(x)
}
