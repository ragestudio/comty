import React from "react"
import classnames from "classnames"
import * as antd from "antd"
import progressBar from "nprogress"

import Sidebar from "./sidebar"
import Drawer from "./drawer"
import Sidedrawer from "./sidedrawer"
import BottomBar from "./bottomBar"

const LayoutRenders = {
	mobile: (props) => {
		return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
			<antd.Layout className="content_layout">
				<antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
					<div className={classnames("fade-transverse-active", { "fade-transverse-leave": props.isOnTransition })}>
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
					<div className={classnames("fade-transverse-active", { "fade-transverse-leave": props.isOnTransition })}>
						{React.cloneElement(props.children, props)}
					</div>
				</antd.Layout.Content>
			</antd.Layout>
		</antd.Layout>
	}
}

export default class Layout extends React.PureComponent {
	progressBar = progressBar.configure({ parent: "html", showSpinner: false })

	state = {
		layoutType: "default",
		isOnTransition: false,
		renderLock: true,
		renderError: null,
	}

	setLayout = (layout) => {
		if (typeof LayoutRenders[layout] === "function") {
			return this.setState({
				layoutType: layout,
			})
		}

		return console.error("Layout type not found")
	}

	componentDidMount() {
		window.app.eventBus.on("app.initialization.start", () => {
			this.setState({
				renderLock: true,
			})
		})
		window.app.eventBus.on("app.initialization.finish", () => {
			this.setState({
				renderLock: false,
			})
		})

		if (window.app.settings.get("forceMobileMode") || window.app.isAppCapacitor() || Math.min(window.screen.width, window.screen.height) < 768 || navigator.userAgent.indexOf("Mobi") > -1) {
			window.isMobile = true
			this.setLayout("mobile")
		} else {
			window.isMobile = false
		}

		window.app.eventBus.on("forceMobileMode", (to) => {
			if (to) {
				window.isMobile = true
				this.setLayout("mobile")
			} else {
				window.isMobile = false
				this.setLayout("default")
			}
		})

		window.app.setLocation = (location) => {
			return window.history.pushState(null, null, location)
		}
	}

	onTransitionStart = () => {
		progressBar.start()

		if (!app.settings.get("reduceAnimations")) {
			this.setState({ isOnTransition: true })
		}
	}

	onTransitionFinish = () => {
		progressBar.done()

		if (!app.settings.get("reduceAnimations")) {
			this.setState({ isOnTransition: false })
		}
	}

	componentDidCatch(info, stack) {
		this.setState({ renderError: { info, stack } })
	}

	render() {
		const InitializationComponent = this.props.staticRenders?.Initialization ? React.createElement(this.props.staticRenders.Initialization) : null

		if (this.state.renderError) {
			if (this.props.staticRenders?.RenderError) {
				return React.createElement(this.props.staticRenders?.RenderError, { error: this.state.renderError })
			}

			return JSON.stringify(this.state.renderError)
		}

		const layoutComponentProps = {
			...this.props.bindProps,
			...this.state,
			onTransitionStart: this.onTransitionStart,
			onTransitionFinish: this.onTransitionFinish,
		}

		const Layout = LayoutRenders[this.state.layoutType]

		return <Layout {...layoutComponentProps}>
			{this.state.renderLock ? InitializationComponent : this.props.children}
		</Layout>
	}
}