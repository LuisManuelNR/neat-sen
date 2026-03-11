// import * as Cells from './Cells'

// export const NODE_POOL = {
// 	...Cells
// } as const
// export const EDGE_POOL = NODE_POOL

// import { BSpline } from './Bspline'
import { Identity, Scalar, Sine, BSpline, TanhCell } from './Cells'
export const NODE_POOL = {
	Identity,
	TanhCell
} as const
export const EDGE_POOL = {
	Scalar
} as const
