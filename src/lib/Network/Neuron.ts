import { relu, tanhAct } from '$lib/utils'

class Neuron {
  nIn: number
  nWeightsPerEdge: number
  weights: number[][]
  bias: number
  xIn: number[] | null
  xMid: number[] | null
  xOut: number[] | null
  dXOutDXMid: number[] | null
  dXOutDBias: number | null
  dXMidDW: number[][] | null
  dXMidDXIn: number[] | null
  dXOutDXIn: number[] | null
  dXOutDW: number[][] | null

  constructor(
    nIn: number,
    nWeightsPerEdge: number,
    weightsRange: [number, number] = [-1, 1]
  ) {
    this.nIn = nIn
    this.nWeightsPerEdge = nWeightsPerEdge
    this.weights = Array.from({ length: nIn }, () =>
      Array.from({ length: nWeightsPerEdge }, () =>
        Math.random() * (weightsRange[1] - weightsRange[0]) + weightsRange[0]
      )
    )
    this.bias = 0
    this.xIn = null
    this.xMid = null
    this.xOut = null
    this.dXOutDXMid = null
    this.dXOutDBias = null
    this.dXMidDW = null
    this.dXMidDXIn = null
    this.dXOutDXIn = null
    this.dXOutDW = null
  }

  call(xIn: number[]): number[] | null {
    this.xIn = xIn
    this.computeXMid()
    this.computeXOut()

    this.computeDXOutDXMid()
    this.computeDXOutDBias()
    this.computeDXMidDW()
    this.computeDXMidDXIn()

    if (
      !(
        this.dXOutDXMid &&
        this.dXMidDXIn &&
        this.dXMidDW &&
        this.dXOutDXMid.length === this.nIn &&
        this.dXMidDXIn.length === this.nIn &&
        this.dXMidDW.length === this.nIn &&
        this.dXMidDW[0].length === this.nWeightsPerEdge
      )
    ) {
      throw new Error("Shape mismatch in internal derivatives")
    }

    this.computeDXOutDXIn()
    this.computeDXOutDW()

    return this.xOut
  }

  computeXMid(): void {
    // Compute this.xMid
  }

  computeXOut(): void {
    // Compute this.xOut
  }

  computeDXOutDXMid(): void {
    // Compute this.dXOutDXMid
  }

  computeDXOutDBias(): void {
    // Compute this.dXOutDBias
  }

  computeDXMidDW(): void {
    // Compute this.dXMidDW
  }

  computeDXMidDXIn(): void {
    // Compute this.dXMidDXIn
  }

  computeDXOutDXIn(): void {
    if (this.dXOutDXMid && this.dXMidDXIn) {
      this.dXOutDXIn = this.dXOutDXMid.map((d, i) => d * this.dXMidDXIn![i])
    }
  }

  computeDXOutDW(): void {
    if (this.dXOutDXMid && this.dXMidDW) {
      this.dXOutDW = this.dXMidDW.map((row, i) =>
        row.map((dw) => dw * this.dXOutDXMid![i])
      )
    }
  }
}

export class NeuronNN extends Neuron {
  activation: (input: number, getDerivative?: boolean) => number
  activationInput: number | null

  constructor(
    nIn: number,
    weightsRange: [number, number] = [-1, 1],
    activation: (input: number, getDerivative?: boolean) => number = relu
  ) {
    super(nIn, 1, weightsRange)
    this.activation = activation
    this.activationInput = null
  }

  computeXMid(): void {
    if (this.xIn) {
      this.xMid = this.weights.map((row) => row[0] * this.xIn![0])
    }
  }

  computeXOut(): void {
    if (this.xMid) {
      this.activationInput = this.xMid.reduce((acc, val) => acc + val, 0) + this.bias
      this.xOut = [this.activation(this.activationInput, false)]
    }
  }

  computeDXOutDXMid(): void {
    if (this.activationInput !== null) {
      const derivative = this.activation(this.activationInput, true)
      this.dXOutDXMid = Array(this.nIn).fill(derivative)
    }
  }

  computeDXOutDBias(): void {
    if (this.activationInput !== null) {
      this.dXOutDBias = this.activation(this.activationInput, true)
    }
  }

  computeDXMidDW(): void {
    if (this.xIn) {
      this.dXMidDW = this.xIn.map((value) => [value])
    }
  }

  computeDXMidDXIn(): void {
    this.dXMidDXIn = this.weights.map((row) => row[0])
  }
}

// import { getBSplines } from "./utils/edgeFun"; // Importa la función para obtener funciones de borde

export class NeuronKAN extends Neuron {
  xBounds: [number, number]
  edgeFun: { [key: string]: (x: number[]) => number[] }
  edgeFunDer: { [key: string]: (x: number[]) => number[] }
  phiXMat: number[][] | null

  constructor(
    nIn: number,
    nWeightsPerEdge: number,
    xBounds: [number, number],
    weightsRange: [number, number] = [-1, 1],
    getEdgeFun: (xBounds: [number, number], nWeightsPerEdge: number, ...args: any[]) =>
      [{ [key: string]: (x: number[]) => number[] }, { [key: string]: (x: number[]) => number[] }] = getBSplines,
    ...args: any[]
  ) {
    super(nIn, nWeightsPerEdge, weightsRange)
    this.xBounds = xBounds;
    [this.edgeFun, this.edgeFunDer] = getEdgeFun(this.xBounds, this.nWeightsPerEdge, ...args)
    this.phiXMat = null
  }

  computeXMid(): void {
    if (!this.xIn) return
    // Aplica las funciones de borde
    this.phiXMat = Object.keys(this.edgeFun).map((key) =>
      this.edgeFun[key](this.xIn)
    )
    this.phiXMat = this.phiXMat.map((row) =>
      row.map((value) => (isNaN(value) ? 0 : value))
    )

    if (this.phiXMat) {
      this.xMid = this.phiXMat.map((row, i) =>
        row.reduce((sum, value, j) => sum + value * this.weights[i][j], 0)
      )
    }
  }

  computeXOut(): void {
    if (!this.xMid) return
    const midSum = this.xMid.reduce((acc, val) => acc + val, 0)
    this.xOut = [tanhAct(midSum, false)]
  }

  computeDXOutDXMid(): void {
    if (!this.xMid) return
    const midSum = this.xMid.reduce((acc, val) => acc + val, 0)
    const derivative = tanhAct(midSum, true)
    this.dXOutDXMid = Array(this.nIn).fill(derivative)
  }

  computeDXMidDW(): void {
    if (this.phiXMat) {
      this.dXMidDW = this.phiXMat
    }
  }

  computeDXMidDXIn(): void {
    if (!this.xIn) return

    const phiXDerMat = Object.keys(this.edgeFunDer).map((key) =>
      this.edgeFunDer[key](this.xIn).map((value) => (isNaN(value) ? 0 : value))
    )

    this.dXMidDXIn = this.weights.map((row, i) =>
      row.reduce((sum, weight, j) => sum + weight * phiXDerMat[j][i], 0)
    )
  }

  computeDXOutDBias(): void {
    // No hay bias en KAN
    this.dXOutDBias = 0
  }
}
