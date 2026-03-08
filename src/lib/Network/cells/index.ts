import { Radial } from './Radial'
import { BSpline } from './Bspline'
import { Scalar } from './Scalar'

export const NODE_POOL = {
	Scalar,
	Radial,
	BSpline
} as const
export const EDGE_POOL = {
	Scalar
} as const
