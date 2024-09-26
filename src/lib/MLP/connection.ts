import type { Node } from './node'

export class Connection {
	from: Node
	to: Node
	gain: number
	weight: number
	gater: Node | null
	elegibility: number
	previousDeltaWeight: number
	totalDeltaWeight: number
	xtrace: {
		nodes: Node[]
		values: number[]
	}

	constructor(from: Node, to: Node, weight?: number) {
		this.from = from
		this.to = to
		this.gain = 1
		this.weight = weight ?? Math.random() * 0.2 - 0.1
		this.gater = null
		this.elegibility = 0
		this.previousDeltaWeight = 0
		this.totalDeltaWeight = 0
		this.xtrace = {
			nodes: [],
			values: []
		}
	}

	static innovationID(a: number, b: number): number {
		return ((a + b) * (a + b + 1)) / 2 + b
	}
}
