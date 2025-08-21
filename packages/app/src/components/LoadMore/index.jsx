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
	const [loading, setLoading] = React.useState(false)

	let observer = null

	const insideViewportCb = (entries) => {
		if (loading) {
			return false
		}

		const { fetching, onBottom, hasMore } = props

		if (!hasMore) {
			return false
		}

		entries.forEach((element) => {
			if (element.intersectionRatio > 0 && !fetching) {
				setLoading(true)

				onBottom().then(() => {
					setLoading(false)
				})
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
		<div
			ref={ref}
			className={classnames(className)}
			{...contentProps}
		>
			{children}

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
