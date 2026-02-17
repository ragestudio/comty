import React from "react"

let timer = null

const useHideOnMouseStop = ({
	delay = 2000,
	hideCursor = false,
	initialHide = false,
	showOnlyOnContainerHover = false,
}) => {
	const [hide, setHide] = React.useState(initialHide)
	const mountedRef = React.useRef(false)
	const [hover, setHover] = React.useState(false)
	const toggleVisibility = React.useCallback(
		(hide, cursor) => {
			setHide(hide)
			if (hideCursor) {
				document.body.style.cursor = cursor
			}
		},
		[hideCursor],
	)
	const onMouseEnter = React.useCallback(() => setHover(true), [setHover])
	const onMouseLeave = React.useCallback(() => setHover(false), [setHover])
	const onMouseMove = React.useCallback(() => {
		clearTimeout(timer)

		if (hide && mountedRef.current) {
			if (showOnlyOnContainerHover && hover) {
				toggleVisibility(!hide, "default")
			} else if (!showOnlyOnContainerHover) {
				toggleVisibility(!hide, "default")
			}
		}

		timer = setTimeout(() => {
			if (!hover && mountedRef.current) {
				toggleVisibility(true, "none")
			}
		}, delay)
	}, [hide, hover, setHide])

	React.useEffect(() => {
		mountedRef.current = true

		return () => {
			mountedRef.current = false
		}
	}, [])

	React.useEffect(() => {
		window.addEventListener("mousemove", onMouseMove)

		return () => {
			window.removeEventListener("mousemove", onMouseMove)
			// set cursor visible
			document.body.style.cursor = "default"
		}
	}, [onMouseMove])

	return [hide, onMouseEnter, onMouseLeave, hover]
}

export default useHideOnMouseStop
