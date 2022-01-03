import React from "react"
import loadable from "@loadable/component"
import routes from "virtual:generated-pages"
import progressBar from "nprogress"

import NotFound from "./statics/404"

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

export class RouteRender extends React.Component {
	state = {
		routes: GetRoutesComponentMap() ?? {},
		error: null,
	}

	lastLocation = null

	componentDidMount() {
		window.app.eventBus.on("locationChange", (event) => {
			console.debug("[App] LocationChange, forcing update render...")

			// render controller needs an better method for update render, this is a temporary solution
			// FIXME: this event is called multiple times. we need to debug them methods
			if (typeof this.forceUpdate === "function") {
				this.forceUpdate()
			}
		})
	}

	componentDidCatch(info, stack) {
		this.setState({ error: { info, stack } })
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	if (this.lastLocation.pathname !== window.location.pathname) {
	// 		return true
	// 	}
	// 	return false
	// }

	render() {
		this.lastLocation = window.location

		let path = this.props.path ?? window.location.pathname
		let componentModule = this.state.routes[path] ?? this.props.staticRenders.NotFound ?? NotFound

		console.debug(`[RouteRender] Rendering ${path}`)

		if (this.state.error) {
			if (this.props.staticRenders?.RenderError) {
				return React.createElement(this.props.staticRenders?.RenderError, { error: this.state.error })
			}

			return JSON.stringify(this.state.error)
		}

		return React.createElement(ConnectWithApp(componentModule), this.props)
	}
}

export const LazyRouteRender = (props) => {
	const component = loadable(async () => {
		// TODO: Support evite async component initializations

		return RouteRender
	})

	return React.createElement(component)
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