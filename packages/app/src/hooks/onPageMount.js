import config from "@config"

export const isAuthenticated = () => {
	return !!app.userData
}

export const handleProtectedPath = (isPublicPath) => {
	if (
		!isAuthenticated() &&
		!isPublicPath &&
		window.location.pathname !== config.app?.authPath
	) {
		const authPath = config.app?.authPath ?? "/login"

		if (typeof window.app?.location?.push === "function") {
			window.app.location.push(authPath)
		} else {
			window.location.href = authPath
		}

		return false
	}

	return true
}

export const handleLayout = (layout) => {
	if (!app.layout || !app.layout?.set) {
		return null
	}

	app.layout.set(layout)
}

/**
 * @param {boolean | { mobile?: boolean, desktop?: boolean } | null} option
 */
export const handleCenteredContent = (option) => {
	if (!app.layout || !app.layout?.toggleCenteredContent) {
		return null
	}

	if (typeof option !== "boolean") {
		return app.layout.toggleCenteredContent(false)
	}

	return app.layout.toggleCenteredContent(option)
}

export const handleMaxWindowHeight = (option) => {
	// check if max window height is available
	if (!app.layout?.toggleTotalWindowHeight) {
		return null
	}

	// if the option is not a  boolean, then just set the sidebar visible
	if (typeof option !== "boolean") {
		return app.layout.toggleTotalWindowHeight(false)
	}

	return app.layout.toggleTotalWindowHeight(option)
}

export const handleSidebarVisibility = (option) => {
	// check if sidebar is available
	if (!app.layout?.sidebar || !app.layout?.sidebar?.toggleVisibility) {
		return null
	}

	// if the option is not a  boolean, then just set the sidebar visible
	if (typeof option !== "boolean") {
		return app.layout.sidebar.toggleVisibility(true)
	}

	return app.layout.sidebar.toggleVisibility(option)
}

export const handleToolbarVisibility = (option) => {
	// check if sidebar is available
	if (!app.layout?.tools_bar || !app.layout?.tools_bar?.toggleVisibility) {
		return null
	}

	if (typeof option !== "boolean") {
		return app.layout.tools_bar.toggleVisibility(true)
	}

	return app.layout.tools_bar.toggleVisibility(option)
}

export const handleTitle = (targetTitle) => {
	if (targetTitle) {
		document.title = `${targetTitle} - ${config.app.siteName}`
	} else {
		document.title = config.app.siteName
	}
}

export default ({ element, declaration }) => {
	const options = element.options ?? {}

	// handle authentication first
	handleProtectedPath(declaration?.public)

	// handle layout options
	handleLayout(options.layout?.type ?? declaration?.useLayout ?? "default")
	handleCenteredContent(
		options.layout?.centeredContent ?? declaration?.centeredContent,
	)
	handleMaxWindowHeight(options.layout?.maxHeight ?? declaration?.maxHeight)

	// handle visibilities
	handleSidebarVisibility(options.layout?.sidebar ?? declaration?.sidebar)
	handleToolbarVisibility(options.layout?.toolsbar ?? declaration?.toolsbar)
	// TODO: handleHeaderVisibility(options.layout?.header ?? declaration?.header)

	// handle mobile components visibilities
	// TODO: handleTopBarVisibility(options.layout?.topBar ?? declaration?.topBar)
	// TODO: handleBottomBarVisibility(options.layout?.footer ?? declaration?.footer)

	// handle title
	handleTitle(options.useTitle ?? declaration?.useTitle)
}
