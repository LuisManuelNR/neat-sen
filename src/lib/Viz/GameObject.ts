export class GameObject {
	x = 0
	y = 0
	angle = 0

	forward(delta: number) {
		this.x += delta * Math.cos(this.angle) // Cambia la posición en el eje x
		this.y += delta * Math.sin(this.angle) // Cambia la posición en el eje y
	}

	// Método que te dice en que angulo está otro GameObject
	angleTo(target: GameObject) {
		const dx = target.x - this.x
		const dy = target.y - this.y
		return Math.atan2(dy, dx)
	}

	lookingAt(target: GameObject): number {
		const angleToTarget = this.angleTo(target) // Ángulo hacia el objetivo
		const angleDifference = Math.abs((this.angle - angleToTarget + Math.PI * 2) % (2 * Math.PI)) // Diferencia de ángulo en radianes

		// Asegurarse de que la diferencia esté en el rango de 0 a π para una comparación simétrica
		// const normalizedDifference = Math.min(angleDifference, 2 * Math.PI - angleDifference)

		// Convertir el ángulo a un valor entre 0 y 1
		// Cuando normalizedDifference es 0, significa que está mirando al objetivo (1)
		// Cuando normalizedDifference es Math.PI, está en sentido contrario (0)
		return angleDifference
	}

	distanceTo(target: GameObject): number {
		const dx = target.x - this.x
		const dy = target.y - this.y
		// Distancia euclidiana
		return Math.sqrt(dx * dx + dy * dy)
	}
}
