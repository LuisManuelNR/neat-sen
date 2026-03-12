export class GameObject {
	x = 0
	y = 0

	#angle = 0 // radianes
	private dirX = 1
	private dirY = 0

	domain: [number, number]
	private maxDist: number

	constructor(maxX: number, maxY: number) {
		this.domain = [maxX, maxY]
		this.maxDist = Math.sqrt(maxX * maxX + maxY * maxY)
	}

	get angle() {
		return this.#angle
	}

	set angle(angle: number) {
		this.#angle = angle
		this.dirX = Math.cos(angle)
		this.dirY = Math.sin(angle)
	}

	forward(delta: number) {
		this.x += this.dirX * delta
		this.y += this.dirY * delta
	}

	lookingAt(target: GameObject): number {
		const dx = target.x - this.x
		const dy = target.y - this.y

		const lenSq = dx * dx + dy * dy
		if (lenSq === 0) return 1

		const dot = this.dirX * dx + this.dirY * dy
		const r = dot / Math.sqrt(lenSq)
		return Number.isNaN(r) ? -1 : r
	}

	distanceTo(target: GameObject): number {
		const dx = target.x - this.x
		const dy = target.y - this.y

		const distSq = dx * dx + dy * dy
		if (Number.isNaN(distSq)) return this.maxDist

		return Math.sqrt(distSq)
	}
}
