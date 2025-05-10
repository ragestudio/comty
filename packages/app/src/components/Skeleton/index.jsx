import React from "react"
import { Skeleton } from "antd"

import "./index.less"

const SkeletonComponent = () => {
	return (
		<div className="skeleton">
			<Skeleton active />
		</div>
	)
}

export default SkeletonComponent
