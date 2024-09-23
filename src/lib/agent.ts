export class Brain {
  inputs: number[]
  outputs: number[]
  connections: [number, number][] = [[1, 1]] // a y b escalares
  constructor(inputs: number[], outputs: number[]) {
    this.inputs = inputs
    this.outputs = outputs
  }

  #addNode() {
    this.connections.push([1, 1])
  }

  think(inputs: number[]) {
    const sum = this.inputs.reduce((acc, current) => acc + current, 0)
    let result = 0
    this.connections.forEach(c => {
      result += Math.sin(c[0] * sum + c[1])
    })
    return result
  }
}