import React from "react"
import classnames from "classnames"
import * as antd from "antd"
import progressBar from "nprogress"

import Sidebar from "./sidebar"
import Drawer from "./drawer"
import Sidedrawer from "./sidedrawer"
import BottomBar from "./bottomBar"

import config from "config"

import routes from "schemas/routes"

const LayoutRenders = {
	mobile: (props) => {
		return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
			<antd.Layout className="content_layout">
				<antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
					<div id="transitionLayer" className="fade-transverse-active">
						{React.cloneElement(props.children, props)}
					</div>
				</antd.Layout.Content>
			</antd.Layout>
			<BottomBar user={props.user} />
			<Drawer />
		</antd.Layout>
	},
	default: (props) => {
		return <antd.Layout className="app_layout" style={{ height: "100%" }}>
			<Drawer />
			<Sidebar user={props.user} />
			<Sidedrawer />
			<antd.Layout className="content_layout">
				<antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
					<div id="transitionLayer" className="fade-transverse-active">
						{React.cloneElement(props.children, props)}
					</div>
				</antd.Layout.Content>
			</antd.Layout>
		</antd.Layout>
	}
}

export default class Layout extends React.Component {
	progressBar = progressBar.configure({ parent: "html", showSpinner: false })

	state = {
		layoutType: "default",
		renderLock: true,
		renderError: null,
	}

	events = {
		"app.initialization.start": () => {
			this.setState({
				renderLock: true,
			})
		},
		"app.initialization.finish": () => {
			this.setState({
				renderLock: false,
			})
		},
		"router.transitionStart": () => {
			this.progressBar.start()

			if (!app.settings.get("reduceAnimations")) {
				// add "fade-transverse-leave" class to `transitionLayer`
				document.getElementById("transitionLayer").classList.add("fade-transverse-leave")
			}
		},
		"router.transitionFinish": () => {
			this.progressBar.done()

			if (!app.settings.get("reduceAnimations")) {
				// remove "fade-transverse-leave" class to `transitionLayer`
				document.getElementById("transitionLayer").classList.remove("fade-transverse-leave")
			}
		},
	}

	componentDidMount() {
		if (window.app.settings.get("forceMobileMode") || window.app.isAppCapacitor() || Math.min(window.screen.width, window.screen.height) < 768 || navigator.userAgent.indexOf("Mobi") > -1) {
			window.isMobile = true

			this.setLayout("mobile")
		} else {
			window.isMobile = false
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

	setLayout = (layout) => {
		if (typeof LayoutRenders[layout] === "function") {
			return this.setState({
				layoutType: layout,
			})
		}

		return console.error("Layout type not found")
	}

	render() {
		let layoutType = this.state.layoutType
		const InitializationComponent = this.props.staticRenders?.Initialization ? React.createElement(this.props.staticRenders.Initialization) : null

		if (this.state.renderError) {
			if (this.props.staticRenders?.RenderError) {
				return React.createElement(this.props.staticRenders?.RenderError, { error: this.state.renderError })
			}

			return JSON.stringify(this.state.renderError)
		}

		console.debug(`Rendering layout [${this.state.layoutType}] for current route [${window.location.pathname}]`)

		// check with the current route if it's a protected route or requires some permissions
		const routeDeclaration = routes.find((route) => route.path === window.location.pathname)

		if (routeDeclaration) {
			if (typeof routeDeclaration.requiredRoles !== "undefined") {
				const isAdmin = this.props.user?.roles?.includes("admin") ?? false

				if (!isAdmin && !routeDeclaration.requiredRoles.some((role) => this.props.user?.roles?.includes(role))) {
					return <antd.Result
						status="403"
						title="403"
						subTitle="Sorry, you are not authorized to access this page."
						extra={<antd.Button type="primary" onClick={() => window.app.setLocation("/")}>Back Home</antd.Button>}
					/>
				}
			}

			if (typeof routeDeclaration.useLayout !== "undefined") {
				layoutType = routeDeclaration.useLayout
			}

			if (typeof routeDeclaration.webTitleAddition !== "undefined") {
				document.title = `${routeDeclaration.webTitleAddition} - ${config.app.siteName}`
			} else {
				document.title = config.app.siteName
			}
		}

		const layoutComponentProps = {
			...this.props.bindProps,
			...this.state,
		}

		const Layout = LayoutRenders[layoutType]

		return <Layout {...layoutComponentProps}>
			{this.state.renderLock ? InitializationComponent : this.props.children}
		</Layout>
	}
}