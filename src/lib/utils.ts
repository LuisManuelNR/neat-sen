export function range(range: [number, number], N: number): number[] {
  const [min, max] = range
  const result: number[] = []
  const step = (max - min) / (N - 1) // Calcular el tamaño del paso

  for (let i = 0; i < N; i++) {
    result.push(min + i * step) // Añadir valores espaciados uniformemente
  }

  return result
}