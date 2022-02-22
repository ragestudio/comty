import React from "react"
import { EvitePureComponent } from "evite"
import routes from "virtual:generated-pages"
import progressBar from "nprogress"

import NotFoundRender from "./statics/404"
import CrashRender from "./statics/crash"

export const ConnectWithApp = (component) => {
	return window.app.bindContexts(component)
}

export function GetRoutesMap() {
	return routes.map((route) => {
		const { path } = route
		route.name =
			path
				.replace(/^\//, "")
				.replace(/:/, "")
				.replace(/\//, "-")
				.replace("all(.*)", "not-found") || "home"

		route.path = route.path.includes("*") ? "*" : route.path

		return route
	})
}

export function GetRoutesComponentMap() {
	return routes.reduce((acc, route) => {
		const { path, component } = route

		acc[path] = component

		return acc
	}, {})
}

// class PageStatement {
// 	constructor() {
// 		this.state = {}

// 	}

// 	getProxy() {

// 	}
// }

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
		"render_initialization": () => {
			this.setState({ renderInitialization: true })
		},
		"render_initialization_done": () => {
			this.setState({ renderInitialization: false })
		},
		"crash": (message, error) => {
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

		if (this.state.renderInitialization) {
			const StaticInitializationRender = this.props.staticRenders?.initialization ?? null

			return <StaticInitializationRender />
		}

		if (!this.state.renderComponent) {
			return null
		}

		return React.createElement(ConnectWithApp(this.state.renderComponent), this.props)
	}
}

export const extension = {
	key: "customRender",
	expose: [
		{
			initialization: [
				async (app, main) => {
					app.bindContexts = (component) => {
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

					main.setToWindowContext("bindContexts", app.bindContexts)
				},
				async (app, main) => {
					const defaultTransitionDelay = 150

					main.progressBar = progressBar.configure({ parent: "html", showSpinner: false })

					main.history.listen((event) => {
						main.eventBus.emit("transitionDone", event)
						main.eventBus.emit("locationChange", event)
						main.progressBar.done()
					})

					main.history.setLocation = (to, state, delay) => {
						const lastLocation = main.history.lastLocation

						if (typeof lastLocation !== "undefined" && lastLocation?.pathname === to && lastLocation?.state === state) {
							return false
						}

						main.progressBar.start()
						main.eventBus.emit("transitionStart", delay)

						setTimeout(() => {
							main.history.push({
								pathname: to,
							}, state)
							main.history.lastLocation = main.history.location
						}, delay ?? defaultTransitionDelay)
					}

					main.setToWindowContext("setLocation", main.history.setLocation)
				},
			],
			mutateContext: {
				validateLocationSlash: (location) => {
					let key = location ?? window.location.pathname

					while (key[0] === "/") {
						key = key.slice(1, key.length)
					}

					return key
				},
			},
		},
	],
}

export default extension