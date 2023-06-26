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
		// register events
		Object.keys(this.events).forEach((event) => {
			window.app.eventBus.on(event, this.events[event])
		})

		if (app.isMobile) {
			this.layoutInterface.toogleMobileStyle(true)
		}

		if (app.cores.settings.get("reduceAnimations")) {
			this.layoutInterface.toogleRootContainerClassname("reduce-animations", true)
		}
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

		const content_layout = document.getElementById("content_layout")

		if (!content_layout) {
			console.warn("content_layout not found, no animation will be played")

			this.progressBar.done()

			return false
		}

		content_layout.classList.add("fade-transverse-leave")

		setTimeout(() => {
			this.progressBar.done()

			content_layout.classList.remove("fade-transverse-leave")
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
			return this.layoutInterface.toogleRootContainerClassname("centered-content", to)
		},
		toogleMobileStyle: (to) => {
			return this.layoutInterface.toogleRootContainerClassname("mobile", to)
		},
		toogleReducedAnimations: (to) => {
			return this.layoutInterface.toogleRootContainerClassname("reduce-animations", to)
		},
		toogleTopBarSpacer: (to) => {
			return this.layoutInterface.toogleRootContainerClassname("top-bar-spacer", to)
		},
		tooglePagePanelSpacer: (to) => {
			return this.layoutInterface.toogleRootContainerClassname("page-panel-spacer", to)
		},
		toogleRootContainerClassname: (classname, to) => {
			const root = document.getElementById("root")

			if (!root) {
				console.error("root not found")
				return false
			}

			to = typeof to === "boolean" ? to : !root.classList.contains(classname)

			if (root.classList.contains(classname) === to) {
				// ignore
				return false
			}

			if (to === true) {
				root.classList.add(classname)
			} else {
				root.classList.remove(classname)
			}
		},
		scrollTo: (to) => {
			const content_layout = document.getElementById("content_layout")

			if (!content_layout) {
				console.error("content_layout not found")
				return false
			}

			content_layout.scrollTo({
				...to,
				behavior: "smooth",
			})
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

		const Layout = Layouts[layoutType]

		if (!Layout) {
			return app.eventBus.emit("runtime.crash", new Error(`Layout type [${layoutType}] not found`))
		}

		return <Layout {...layoutComponentProps}>
			{this.props.children}
		</Layout>
	}
}