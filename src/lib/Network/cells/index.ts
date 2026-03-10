// import * as Cells from './Cells'

// export const NODE_POOL = {
// 	...Cells
// } as const
// export const EDGE_POOL = NODE_POOL

import { BSpline, Identity, Scalar, Sine } from './Cells'
export const NODE_POOL = {
	BSpline
} as const
export const EDGE_POOL = {
	Scalar
} as const
