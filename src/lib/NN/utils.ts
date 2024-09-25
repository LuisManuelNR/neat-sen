export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

export function sigmoid_derivee(x) {
  //x already sigmoided !
  return x * (1 - x)
}

export function mutation(x: number) {
  if (random(1) < mutationRate) {
    return x + randomGaussian(0, mutationChange) //??? ou 0.2
  } else {
    return x
  }
}