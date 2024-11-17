import React from "react"
import progressBar from "nprogress"

import Layouts from "@layouts"

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
		}
	}

	componentDidMount() {
		// register events
		Object.keys(this.events).forEach((event) => {
			window.app.eventBus.on(event, this.events[event])
		})

		if (app.isMobile) {
			this.layoutInterface.toggleMobileStyle(true)
		}

		if (app.cores.settings.get("reduceAnimations")) {
			this.layoutInterface.toggleRootContainerClassname("reduce-animations", true)
		}

		this.layoutInterface.toggleCenteredContent(true)
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
		toggleCenteredContent: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("centered-content", to)
		},
		toggleRootScaleEffect: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("root-scale-effect", to)
		},
		toggleMobileStyle: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("mobile", to)
		},
		toggleReducedAnimations: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("reduce-animations", to)
		},
		toggleTopBarSpacer: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("top-bar-spacer", to)
		},
		toggleDisableTopLayoutPadding: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("disable-top-layout-padding", to)
		},
		togglePagePanelSpacer: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("page-panel-spacer", to)
		},
		toggleCompactMode: (to) => {
			return this.layoutInterface.toggleRootContainerClassname("compact-mode", to)
		},
		toggleRootContainerClassname: (classname, to) => {
			const root = document.documentElement

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
		rootContainerHasClassname: (classname) => {
			const root = document.documentElement

			if (!root) {
				console.error("root not found")
				return false
			}

			return root.classList.contains(classname)
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