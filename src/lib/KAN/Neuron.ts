import { randomNumber } from '@chasi/ui/utils'
import { BSpline } from './BSpline'

export class Neuron {
  spline: BSpline

  constructor() {
    const points = Math.floor(randomNumber(2, 10))
    this.spline = new BSpline(points)
  }

  forward(inputs: number[]): number {
    let sum = 0
    inputs.forEach(input => {
      sum += this.spline.evaluate(input)
    })
    return sum / inputs.length
  }

  mutate() {
    this.spline.mutate()
  }

  clone() {
    const clone = new Neuron()
    clone.spline = this.spline.clone()
    return clone
  }
}
