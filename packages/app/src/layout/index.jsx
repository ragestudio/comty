import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import Sidebar from "./sidebar"
import Header from "./header"
import Drawer from "./drawer"
import Sidedrawer from "./sidedrawer"
import BottomBar from "./bottomBar"

const LayoutRenders = {
	mobile: (props) => {
		return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
			<antd.Layout className="content_layout">
				<antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
					<div className={classnames("fade-transverse-active", { "fade-transverse-leave": props.isOnTransition })}>
						{props.children}
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
				<Header />
				<antd.Layout.Content className={classnames("layout_page", ...props.layoutPageModesClassnames ?? [])}>
					<div className={classnames("fade-transverse-active", { "fade-transverse-leave": props.isOnTransition })}>
						{props.children}
					</div>
				</antd.Layout.Content>
			</antd.Layout>
		</antd.Layout>
	}
}

export default class Layout extends React.Component {
	state = {
		layoutType: "default",
		isOnTransition: false,
		compactMode: false,
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
		window.app.eventBus.on("transitionStart", () => {
			this.setState({ isOnTransition: true })
		})
		window.app.eventBus.on("transitionDone", () => {
			this.setState({ isOnTransition: false })
		})
		window.app.eventBus.on("toogleCompactMode", (to) => {
			this.setState({
				compactMode: to ?? !this.state.compactMode,
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
	}

	render() {
		const layoutComponentProps = {
			...this.props,
			...this.state,
			layoutPageModesClassnames: [{
				["noMargin"]: this.state.compactMode,
			}]
		}

		if (LayoutRenders[this.state.layoutType]) {
			return LayoutRenders[this.state.layoutType](layoutComponentProps)
		}

		return LayoutRenders.default(layoutComponentProps)
	}
}