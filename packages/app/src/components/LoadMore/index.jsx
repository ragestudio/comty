import React from "react"
import classnames from "classnames"

import "./index.less"

const LoadMore = React.forwardRef((props, ref) => {
	const {
		className,
		children,
		hasMore = false,
		loadingComponent,
		contentProps = {},
	} = props

	const nodeRef = React.useRef(null)

	let observer = null

	const insideViewportCb = (entries) => {
		const { fetching, onBottom, hasMore } = props

		if (!hasMore) {
			return false
		}

		entries.forEach((element) => {
			if (element.intersectionRatio > 0 && !fetching) {
				onBottom()
			}
		})
	}

	React.useEffect(() => {
		try {
			observer = new IntersectionObserver(insideViewportCb)
			observer.observe(nodeRef.current)
		} catch (err) {
			console.log("err in finding node", err)
		}

		return () => {
			observer.disconnect()
			observer = null
		}
	}, [])

	return (
		<div ref={ref} className={classnames(className)} {...contentProps}>
			{children}

			{/* <div style={{ clear: "both" }} /> */}

			<div
				ref={nodeRef}
				id="bottom"
				className="bottom"
				style={{ display: hasMore ? "block" : "none" }}
			>
				{loadingComponent && React.createElement(loadingComponent)}
			</div>
		</div>
	)
})

LoadMore.displayName = "LoadMore"

export default LoadMore
