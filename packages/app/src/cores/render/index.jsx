import Core from "evite/src/core"
import React from "react"
import { EvitePureComponent } from "evite"
import progressBar from "nprogress"
import routes from "virtual:generated-pages"

import NotFoundRender from "./staticsRenders/404"
import CrashRender from "./staticsRenders/crash"

export const ConnectWithApp = (component) => {
	return RenderCore.bindContexts(component)
}

export function GetRoutesComponentMap() {
	return routes.reduce((acc, route) => {
		const { path, component } = route

		acc[path] = component

		return acc
	}, {})
}

export class RouteRender extends EvitePureComponent {
	state = {
		renderInitialization: true,
		renderComponent: null,
		renderError: null,
		//pageStatement: new PageStatement(),
		routes: GetRoutesComponentMap() ?? {},
		crash: null,
	}

	handleBusEvents = {
		"app.render_initialization": () => {
			this.setState({ renderInitialization: true })
		},
		"app.render_initialization_done": () => {
			this.setState({ renderInitialization: false })
		},
		"app.crash": (message, error) => {
			this.setState({ crash: { message, error } })
		},
		"locationChange": (event) => {
			this.loadRender()
		},
	}

	componentDidMount() {
		this._ismounted = true
		this._loadBusEvents()
		this.loadRender()
	}

	componentWillUnmount() {
		this._ismounted = false
		this._unloadBusEvents()
	}

	loadRender = (path) => {
		if (!this._ismounted) {
			console.warn("RouteRender is not mounted, skipping render load")
			return false
		}

		let componentModule = this.state.routes[path ?? this.props.path ?? window.location.pathname] ?? this.props.staticRenders?.NotFound ?? NotFoundRender

		// TODO: in a future use, we can use `pageStatement` class for managing statement
		window.app.pageStatement = Object.freeze(componentModule.pageStatement) ?? Object.freeze({})

		return this.setState({ renderComponent: componentModule })
	}

	componentDidCatch(info, stack) {
		this.setState({ renderError: { info, stack } })
	}

	render() {
		if (this.state.crash) {
			const StaticCrashRender = this.props.staticRenders?.Crash ?? CrashRender

			return <StaticCrashRender crash={this.state.crash} />
		}

		if (this.state.renderError) {
			if (this.props.staticRenders?.RenderError) {
				return React.createElement(this.props.staticRenders?.RenderError, { error: this.state.renderError })
			}

			return JSON.stringify(this.state.renderError)
		}

		if (this.state.renderInitialization && this.props.staticRenders?.Initialization) {
			const StaticInitializationRender = this.props.staticRenders?.Initialization ?? <div>Loading...</div>

			return <StaticInitializationRender />
		}

		if (!this.state.renderComponent) {
			return null
		}

		return React.createElement(ConnectWithApp(this.state.renderComponent), this.props)
	}
}

export class RenderCore extends Core {
	progressBar = progressBar.configure({ parent: "html", showSpinner: false })

	initialize = () => {
		const defaultTransitionDelay = 150

		this.ctx.history.listen((event) => {
			this.ctx.eventBus.emit("transitionDone", event)
			this.ctx.eventBus.emit("locationChange", event)

			this.progressBar.done()
		})

		this.ctx.history.setLocation = (to, state, delay) => {
			const lastLocation = this.ctx.history.lastLocation

			if (typeof lastLocation !== "undefined" && lastLocation?.pathname === to && lastLocation?.state === state) {
				return false
			}

			this.progressBar.start()
			this.ctx.eventBus.emit("transitionStart", delay)

			setTimeout(() => {
				this.ctx.history.push({
					pathname: to,
				}, state)
				this.ctx.history.lastLocation = this.history.location
			}, delay ?? defaultTransitionDelay)
		}

		this.ctx.registerPublicMethod("setLocation", this.ctx.history.setLocation)
	}

	validateLocationSlash = (location) => {
		let key = location ?? window.location.pathname

		while (key[0] === "/") {
			key = key.slice(1, key.length)
		}

		return key
	}

	static bindContexts = (component) => {
		let contexts = {
			main: {},
			app: {},
		}

		if (typeof component.bindApp === "string") {
			if (component.bindApp === "all") {
				Object.keys(app).forEach((key) => {
					contexts.app[key] = app[key]
				})
			}
		} else {
			if (Array.isArray(component.bindApp)) {
				component.bindApp.forEach((key) => {
					contexts.app[key] = app[key]
				})
			}
		}

		if (typeof component.bindMain === "string") {
			if (component.bindMain === "all") {
				Object.keys(main).forEach((key) => {
					contexts.main[key] = main[key]
				})
			}
		} else {
			if (Array.isArray(component.bindMain)) {
				component.bindMain.forEach((key) => {
					contexts.main[key] = main[key]
				})
			}
		}

		return (props) => React.createElement(component, { ...props, contexts })
	}
}

export default RenderCore