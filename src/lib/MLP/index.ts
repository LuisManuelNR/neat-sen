import { Node, NODE_TYPE } from './node'
import { Connection } from './connection'
import { methods } from '../methods/methods'
import { Neat } from './neat'

export class Network {
	input: number
	output: number
	nodes: Node[]
	connections: Connection[]
	gates: Connection[]
	selfconns: Connection[]
	dropout: number

	constructor(input: number, output: number) {
		if (input === undefined || output === undefined) {
			throw new Error('No input or output size given')
		}

		this.input = input
		this.output = output

		this.nodes = []
		this.connections = []
		this.gates = []
		this.selfconns = []

		this.dropout = 0

		for (let i = 0; i < input + output; i++) {
			const type = i < input ? NODE_TYPE.INPUT : NODE_TYPE.OUTPUT
			this.nodes.push(new Node(type))
		}

		for (let i = 0; i < input; i++) {
			for (let j = input; j < output + input; j++) {
				const weight = Math.random() * input * Math.sqrt(2 / input)
				this.connect(this.nodes[i], this.nodes[j], weight)
			}
		}
	}

	activate(input: number[]): number[] {
		const output: number[] = []
		for (const node of this.nodes) {
			if (node.type === NODE_TYPE.INPUT) {
				node.activate(input[this.nodes.indexOf(node)])
			} else if (node.type === NODE_TYPE.OUTPUT) {
				const activation = node.activate()
				output.push(activation)
			} else {
				node.activate()
			}
		}
		return output
	}

	connect(from: Node, to: Node, weight?: number): Connection[] {
		const connections = from.connect(to, weight)
		for (const connection of connections) {
			if (from !== to) {
				this.connections.push(connection)
			} else {
				this.selfconns.push(connection)
			}
		}
		return connections
	}

	disconnect(from: Node, to: Node): void {
		const connections = from === to ? this.selfconns : this.connections
		for (let i = 0; i < connections.length; i++) {
			const connection = connections[i]
			if (connection.from === from && connection.to === to) {
				if (connection.gater !== null) this.ungate(connection)
				connections.splice(i, 1)
				break
			}
		}
		from.disconnect(to)
	}

	gate(node: Node, connection: Connection): void {
		if (!this.nodes.includes(node)) {
			throw new Error('This node is not part of the network!')
		} else if (connection.gater != null) {
			throw new Error('This connection is already gated!')
		}
		node.gate(connection)
		this.gates.push(connection)
	}

	ungate(connection: Connection): void {
		const index = this.gates.indexOf(connection)
		if (index === -1) {
			throw new Error('This connection is not gated!')
		}
		this.gates.splice(index, 1)
		connection.gater!.ungate(connection)
	}

	remove(node: Node): void {
		const index = this.nodes.indexOf(node)
		if (index === -1) {
			throw new Error('This node does not exist in the network!')
		}

		const gaters: Node[] = []

		// Remove selfconnections from this.selfconns
		this.disconnect(node, node)

		// Get all its input nodes
		const inputs: Node[] = []
		for (let i = node.connections.in.length - 1; i >= 0; i--) {
			const connection = node.connections.in[i]
			if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
				gaters.push(connection.gater)
			}
			inputs.push(connection.from)
			this.disconnect(connection.from, node)
		}

		// Get all its output nodes
		const outputs: Node[] = []
		for (let i = node.connections.out.length - 1; i >= 0; i--) {
			const connection = node.connections.out[i]
			if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
				gaters.push(connection.gater)
			}
			outputs.push(connection.to)
			this.disconnect(node, connection.to)
		}

		// Connect input nodes to output nodes (if not already connected)
		const connections: Connection[] = []
		for (const input of inputs) {
			for (const output of outputs) {
				if (!input.isProjectingTo(output)) {
					const conn = this.connect(input, output)
					connections.push(conn[0])
				}
			}
		}

		// Gate random connections with gaters
		for (const gater of gaters) {
			if (connections.length === 0) break

			const connIndex = Math.floor(Math.random() * connections.length)
			this.gate(gater, connections[connIndex])
			connections.splice(connIndex, 1)
		}

		// Remove gated connections gated by this node
		for (let i = node.connections.gated.length - 1; i >= 0; i--) {
			this.ungate(node.connections.gated[i])
		}

		// Remove the node from the network
		this.nodes.splice(index, 1)
	}

	mutate(method: any): void {
		if (method === undefined) {
			throw new Error('No mutation method provided!')
		}

		switch (method) {
			case mutation.ADD_NODE:
				// Look for an existing connection and place a node in between
				const connection = this.connections[Math.floor(Math.random() * this.connections.length)]
				const gater = connection.gater
				this.disconnect(connection.from, connection.to)

				// Insert a new node
				const node = new Node('hidden')
				node.mutate(mutation.MOD_ACTIVATION)

				// Connect input node to the new node and new node to output node
				this.connect(connection.from, node)
				this.connect(node, connection.to)

				// Check if the original connection was gated
				if (gater) {
					this.gate(gater, node.connections.out[0])
				}
				break

			case mutation.ADD_CONN:
				const availableConnections = []
				for (let i = 0; i < this.nodes.length - this.output; i++) {
					for (let j = Math.max(i + 1, this.input); j < this.nodes.length; j++) {
						if (!this.nodes[i].isProjectingTo(this.nodes[j])) {
							availableConnections.push([this.nodes[i], this.nodes[j]])
						}
					}
				}

				if (availableConnections.length === 0) {
					throw new Error('No more connections to add.')
				}

				const randomConn = availableConnections[Math.floor(Math.random() * availableConnections.length)]
				this.connect(randomConn[0], randomConn[1])
				break

			case mutation.SUB_CONN:
				const possibleConns = []
				for (const conn of this.connections) {
					if (conn.from.connections.out.length > 1 && conn.to.connections.in.length > 1) {
						possibleConns.push(conn)
					}
				}

				if (possibleConns.length === 0) {
					throw new Error('No more connections to remove!')
				}

				const connToRemove = possibleConns[Math.floor(Math.random() * possibleConns.length)]
				this.disconnect(connToRemove.from, connToRemove.to)
				break

			case mutation.MOD_BIAS:
				const nodeIndex = Math.floor(Math.random() * this.nodes.length)
				this.nodes[nodeIndex].mutate(mutation.MOD_BIAS)
				break

			case mutation.MOD_WEIGHT:
				const allConnections = this.connections.concat(this.selfconns)
				const connIndex = Math.floor(Math.random() * allConnections.length)
				allConnections[connIndex].weight += Math.random() * (method.max - method.min) + method.min
				break
		}
	}
}
