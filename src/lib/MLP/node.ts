import { LOGISTIC } from './activations'
import { Connection } from './connection'

export const NODE_TYPE = {
	INPUT: 0,
	HIDDEN: 1,
	OUTPUT: 2
} as const

type NodeType = (typeof NODE_TYPE)[keyof typeof NODE_TYPE]

export class Node {
	bias: number
	squash: (x: number, derivate?: boolean) => number
	type: NodeType

	activation: number
	state: number
	old: number

	// For dropout
	mask: number

	// For tracking momentum
	previousDeltaBias: number

	// Batch training
	totalDeltaBias: number
	connections: {
		in: Connection[]
		out: Connection[]
		gated: Connection[]
		self: Connection
	}

	constructor(type: NodeType) {
		this.bias = type === NODE_TYPE.INPUT ? 0 : Math.random() * 0.2 - 0.1
		this.squash = LOGISTIC
		this.type = type
		this.activation = 0
		this.state = 0
		this.old = 0
		this.mask = 1
		this.previousDeltaBias = 0
		this.totalDeltaBias = 0
		this.connections = {
			in: [],
			out: [],
			gated: [],
			self: new Connection(this, this, 0)
		}
	}

	activate(input?: number): number {
		if (typeof input !== 'undefined') {
			this.activation = input
			return this.activation
		}

		this.state = this.connections.self.gain * this.connections.self.weight * this.state + this.bias

		for (let i = 0; i < this.connections.in.length; i++) {
			const connection = this.connections.in[i]
			this.state += connection.from.activation * connection.weight * connection.gain
		}

		// Squash the values received
		this.activation = this.squash(this.state)

		for (let i = 0; i < this.connections.gated.length; i++) {
			this.connections.gated[i].gain = this.activation
		}

		return this.activation
	}

	connect(target: Node | { nodes: Node[] }, weight?: number): Connection[] {
		const connections: Connection[] = []

		if (target instanceof Node) {
			// Must be a node
			if (target === this) {
				if (this.connections.self.weight !== 0) {
					console.warn('This connection already exists!')
				} else {
					this.connections.self.weight = weight || 1
				}
				connections.push(this.connections.self)
			} else if (this.isProjectingTo(target)) {
				throw new Error('Already projecting a connection to this node!')
			} else {
				const connection = new Connection(this, target, weight)
				target.connections.in.push(connection)
				this.connections.out.push(connection)
				connections.push(connection)
			}
		} else {
			// Should be a group
			for (const node of target.nodes) {
				const connection = new Connection(this, node, weight)
				node.connections.in.push(connection)
				this.connections.out.push(connection)
				connections.push(connection)
			}
		}

		return connections
	}

	disconnect(node: Node, twosided = false): void {
		if (this === node) {
			this.connections.self.weight = 0
			return
		}

		for (let i = 0; i < this.connections.out.length; i++) {
			const conn = this.connections.out[i]
			if (conn.to === node) {
				this.connections.out.splice(i, 1)
				const j = conn.to.connections.in.indexOf(conn)
				conn.to.connections.in.splice(j, 1)
				if (conn.gater !== null) conn.gater.ungate(conn)
				break
			}
		}

		if (twosided) {
			node.disconnect(this)
		}
	}

	gate(connections: Connection | Connection[]): void {
		if (!Array.isArray(connections)) {
			connections = [connections]
		}

		for (const connection of connections) {
			this.connections.gated.push(connection)
			connection.gater = this
		}
	}

	ungate(connections: Connection | Connection[]): void {
		if (!Array.isArray(connections)) {
			connections = [connections]
		}

		for (let i = connections.length - 1; i >= 0; i--) {
			const connection = connections[i]

			const index = this.connections.gated.indexOf(connection)
			this.connections.gated.splice(index, 1)
			connection.gater = null
			connection.gain = 1
		}
	}

	mutate(method: any): void {
		if (typeof method === 'undefined') {
			throw new Error('No mutate method given!')
		} else if (!(method.name in methods.mutation)) {
			throw new Error('This method does not exist!')
		}

		switch (method) {
			case methods.mutation.MOD_ACTIVATION:
				const squash =
					method.allowed[
						(method.allowed.indexOf(this.squash) + Math.floor(Math.random() * (method.allowed.length - 1)) + 1) %
							method.allowed.length
					]
				this.squash = squash
				break
			case methods.mutation.MOD_BIAS:
				const modification = Math.random() * (method.max - method.min) + method.min
				this.bias += modification
				break
		}
	}

	isProjectingTo(node: Node): boolean {
		if (node === this && this.connections.self.weight !== 0) return true

		for (const conn of this.connections.out) {
			if (conn.to === node) return true
		}

		return false
	}
}
