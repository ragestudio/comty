import config from "@config"

const isAuthenticated = () => {
	return !!app.userData
}

const handleAuthentication = (declaration) => {
	if (
		!isAuthenticated() &&
		!declaration.public &&
		window.location.pathname !== config.app?.authPath
	) {
		const authPath = config.app?.authPath ?? "/login"

		if (typeof window.app?.location?.push === "function") {
			window.app.location.push(authPath)

			if (app.cores?.notifications?.new) {
				app.cores.notifications.new({
					title: "Please login to use this feature.",
					duration: 15,
				})
			}
		} else {
			window.location.href = authPath
		}

		return false
	}
	return true
}

const handleLayout = (declaration) => {
	if (declaration.useLayout && app.layout?.set) {
		app.layout.set(declaration.useLayout)
	}
}

const handleCenteredContent = (declaration) => {
	if (
		typeof declaration.centeredContent !== "undefined" &&
		app.layout?.toggleCenteredContent
	) {
		let finalBool = null

		if (typeof declaration.centeredContent === "boolean") {
			finalBool = declaration.centeredContent
		} else {
			finalBool = app.isMobile
				? (declaration.centeredContent?.mobile ?? null)
				: (declaration.centeredContent?.desktop ?? null)
		}

		app.layout.toggleCenteredContent(finalBool)
	}
}

const handleTitle = (declaration) => {
	if (typeof declaration.useTitle !== "undefined") {
		let title = declaration.useTitle

		document.title = `${title} - ${config.app.siteName}`
	} else {
		document.title = config.app.siteName
	}
}

export default ({ element, declaration }) => {
	const options = element.options ?? {}

	// Handle authentication first
	const isAuthorized = handleAuthentication(declaration)

	if (isAuthorized) {
		handleLayout(declaration)
		handleCenteredContent(declaration)
		handleTitle(declaration)
	}

	if (options.layout) {
		if (typeof options.layout.type === "string" && app.layout?.set) {
			app.layout.set(options.layout.type)
		}

		if (
			typeof options.layout.centeredContent !== "undefined" &&
			app.layout?.toggleCenteredContent
		) {
			app.layout.toggleCenteredContent(options.layout.centeredContent)
		}
	}
}
