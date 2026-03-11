// import * as Cells from './Cells'

// export const NODE_POOL = {
// 	...Cells
// } as const
// export const EDGE_POOL = NODE_POOL

// import { BSpline } from './Bspline'
import { Identity, Scalar, BSpline } from './Cells'
export const NODE_POOL = {
	Identity
} as const
export const EDGE_POOL = {
	BSpline
} as const
