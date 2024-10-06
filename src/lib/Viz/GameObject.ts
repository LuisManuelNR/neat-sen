export class GameObject {
	x = 0
	y = 0
	angle = 0

	forward(speed: number) {
		this.x += speed * Math.cos(this.angle - Math.PI / 2) // Cambia la posición en el eje x
		this.y += speed * Math.sin(this.angle - Math.PI / 2) // Cambia la posición en el eje y
	}

	// Método que te dice en que angulo está otro GameObject
	angleTo(target: GameObject) {
		const dx = target.x - this.x
		const dy = target.y - this.y
		return Math.atan2(dy, dx) + Math.PI / 2
	}

	distanceTo(target: GameObject): number {
		const dx = target.x - this.x
		const dy = target.y - this.y
		// Distancia euclidiana
		return Math.sqrt(dx * dx + dy * dy)
	}
}
