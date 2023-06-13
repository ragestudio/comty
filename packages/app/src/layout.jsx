import React from "react"
import progressBar from "nprogress"

import Layouts from "layouts"

export default class Layout extends React.PureComponent {
	progressBar = progressBar.configure({ parent: "html", showSpinner: false })

	state = {
		layoutType: "default",
		renderError: null,
	}

	events = {
		"layout.forceUpdate": () => {
			this.forceUpdate()
		},
		"layout.animations.fadeOut": () => {
			if (app.cores.settings.get("reduceAnimations")) {
				console.warn("Skipping fadeIn animation due to `reduceAnimations` setting")
				return false
			}

			const transitionLayer = document.getElementById("transitionLayer")

			if (!transitionLayer) {
				console.warn("transitionLayer not found, no animation will be played")
				return false
			}

			transitionLayer.classList.add("fade-opacity-leave")
		},
		"layout.animations.fadeIn": () => {
			if (app.cores.settings.get("reduceAnimations")) {
				console.warn("Skipping fadeOut animation due to `reduceAnimations` setting")
				return false
			}

			const transitionLayer = document.getElementById("transitionLayer")

			if (!transitionLayer) {
				console.warn("transitionLayer not found, no animation will be played")
				return false
			}

			transitionLayer.classList.remove("fade-opacity-leave")
		},
		"router.navigate": (path, options) => {
			this.makePageTransition(path, options)
		},
	}

	componentDidMount() {
		if (window.app.cores.settings.get("forceMobileMode") || app.isMobile) {
			app.layout.set("mobile")
		}

		// register events
		Object.keys(this.events).forEach((event) => {
			window.app.eventBus.on(event, this.events[event])
		})
	}

	componentWillUnmount() {
		// unregister events
		Object.keys(this.events).forEach((event) => {
			window.app.eventBus.off(event, this.events[event])
		})
	}

	componentDidCatch(info, stack) {
		this.setState({ renderError: { info, stack } })
	}

	makePageTransition(path, options = {}) {
		this.progressBar.start()

		if (app.cores.settings.get("reduceAnimations") || options.state?.noTransition) {
			this.progressBar.done()

			return false
		}

		const transitionLayer = document.getElementById("transitionLayer")

		if (!transitionLayer) {
			console.warn("transitionLayer not found, no animation will be played")
			return false
		}

		transitionLayer.classList.add("fade-transverse-leave")

		setTimeout(() => {
			this.progressBar.done()

			transitionLayer.classList.remove("fade-transverse-leave")
		}, options.state?.transitionDelay ?? 250)
	}

	layoutInterface = window.app.layout = {
		set: (layout) => {
			if (typeof Layouts[layout] !== "function") {
				return console.error("Layout not found")
			}

			console.log(`Setting layout to [${layout}]`)

			return this.setState({
				layoutType: layout,
			})
		},
		toogleCenteredContent: (to) => {
			const root = document.getElementById("root")

			if (app.isMobile) {
				console.warn("Skipping centered content on mobile")
				return false
			}

			if (!root) {
				console.error("root not found")
				return false
			}

			to = typeof to === "boolean" ? to : !root.classList.contains("centered-content")

			if (to === true) {
				root.classList.add("centered_content")
			} else {
				root.classList.remove("centered_content")
			}
		}
	}

	render() {
		let layoutType = this.state.layoutType

		const layoutComponentProps = {
			...this.props.bindProps,
			...this.state,
		}

		if (this.state.renderError) {
			if (this.props.staticRenders?.RenderError) {
				return React.createElement(this.props.staticRenders?.RenderError, { error: this.state.renderError })
			}

			return JSON.stringify(this.state.renderError)
		}

		const Layout = Layouts[app.isMobile ? "mobile" : layoutType]

		if (!Layout) {
			return app.eventBus.emit("runtime.crash", new Error(`Layout type [${layoutType}] not found`))
		}

		return <Layout {...layoutComponentProps}>
			{this.props.children}
		</Layout>
	}
}