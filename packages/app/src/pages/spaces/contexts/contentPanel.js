import React from "react"

const DEFAULT_DATA = {
	type: null,
	title: null,
	props: null,
	headerContent: null,
	setContent: () => {},
	registerHeaderContent: () => {},
	unregisterHeaderContent: () => {},
	setSelectedContentTab: () => {},
}

const ContentPanelContext = React.createContext(DEFAULT_DATA)

const useContentPanelHeaderRender = (renderFn) => {
	const ctx = React.useContext(ContentPanelContext)

	const renderFnRef = React.useRef(renderFn)
	const isRegisteredRef = React.useRef(false)

	React.useEffect(() => {
		renderFnRef.current = renderFn

		if (isRegisteredRef.current && renderFn) {
			ctx.registerHeaderContent(renderFn)
		}
	}, [renderFn, ctx])

	React.useEffect(() => {
		if (renderFnRef.current) {
			ctx.registerHeaderContent(renderFnRef.current)
			isRegisteredRef.current = true
		}

		return () => {
			ctx.unregisterHeaderContent()
			isRegisteredRef.current = false
		}
	}, [ctx])
}

const useContentPanelHeaderState = () => {
	const [headerContent, setHeaderContent] = React.useState(null)

	const registerHeaderContent = React.useCallback((renderFn) => {
		if (typeof renderFn === "function") {
			setHeaderContent(() => renderFn)
		} else {
			setHeaderContent(null)
		}
	}, [])

	const unregisterHeaderContent = React.useCallback(() => {
		setHeaderContent(null)
	}, [])

	return {
		headerContent,
		registerHeaderContent,
		unregisterHeaderContent,
	}
}

export default ContentPanelContext

export {
	DEFAULT_DATA,
	ContentPanelContext,
	useContentPanelHeaderRender,
	useContentPanelHeaderState,
}
