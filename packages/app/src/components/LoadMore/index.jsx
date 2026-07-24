import React from "react"
import classnames from "classnames"

import "./index.less"

const LoadMore = (props) => {
	const {
		className,
		children,
		hasMore = false,
		onBottom,
		loadingComponent,
		contentProps = {},
	} = props

	const sentinelRef = React.useRef(null)
	const [fetching, setFetching] = React.useState(false)

	const hasMoreRef = React.useRef(hasMore)
	hasMoreRef.current = hasMore

	const onBottomRef = React.useRef(onBottom)
	onBottomRef.current = onBottom

	const fetchingRef = React.useRef(fetching)
	fetchingRef.current = fetching

	const trigger = React.useCallback(() => {
		if (!hasMoreRef.current) return
		if (fetchingRef.current) return

		const fn = onBottomRef.current
		if (typeof fn !== "function") return

		setFetching(true)
		Promise.resolve(fn()).finally(() => {
			setFetching(false)
		})
	}, [])

	// auto-load when hasMore is true and sentinel is already in viewport
	// (list content is shorter than the scrollable area)
	React.useEffect(() => {
		if (!hasMore) return

		const el = sentinelRef.current
		if (!el) return

		const scrollParent = el.closest(
			"[class*='scroll'], [class*='overflow']",
		)
		const rootBounds = scrollParent
			? scrollParent.getBoundingClientRect()
			: null

		const timer = setTimeout(() => {
			const rect = el.getBoundingClientRect()
			const threshold = rootBounds
				? rootBounds.bottom
				: window.innerHeight

			if (rect.top < threshold) {
				trigger()
			}
		}, 100)

		return () => clearTimeout(timer)
	}, [hasMore, trigger])

	// intersection observer for scroll-based loading
	React.useEffect(() => {
		const el = sentinelRef.current
		if (!el) return

		let observer = null

		try {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && hasMoreRef.current) {
						trigger()
					}
				},
				{ rootMargin: "0px 0px 200px 0px" },
			)
			observer.observe(el)
		} catch (err) {
			console.log("err creating observer", err)
		}

		return () => {
			if (observer) observer.disconnect()
		}
	}, [])

	return (
		<div
			ref={props.ref}
			className={classnames(className)}
			{...contentProps}
		>
			{children}

			<div
				ref={sentinelRef}
				className="bottom"
				style={{ height: "1px" }}
			/>

			{loadingComponent && fetching
				? React.createElement(loadingComponent)
				: null}
		</div>
	)
}

LoadMore.displayName = "LoadMore"

export default LoadMore
