import React from "react"
import classnames from "classnames"
import * as antd from 'antd'
import { enquireScreen, unenquireScreen } from 'enquire-js'

import Sidebar from './sidebar'
import Header from './header'
import Drawer from './drawer'
import Sidedrawer from './sidedrawer'
import BottomBar from "./bottombar"

const LayoutRenders = {
	mobile: (props) => {
		return <antd.Layout className={classnames("app_layout", ["mobile"])} style={{ height: "100%" }}>
			<antd.Layout className="content_layout">
				<antd.Layout.Content className="layout_page">
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
			<antd.Layout className="content_layout">
				<Header />
				<antd.Layout.Content className="layout_page">
					<div className={classnames("fade-transverse-active", { "fade-transverse-leave": props.isOnTransition })}>
						{props.children}
					</div>
				</antd.Layout.Content>
			</antd.Layout>
			<Sidedrawer />
		</antd.Layout>
	}
}

export default class Layout extends React.Component {
	state = {
		layoutType: "default",
		isMobile: false,
		isOnTransition: false,
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
		this.enquireHandler = enquireScreen(mobile => {
			const { isMobile } = this.state

			if (isMobile !== mobile) {
				window.isMobile = mobile
				this.setState({
					isMobile: mobile,
				})
			}

			if (mobile) {
				window.app.eventBus.emit("mobile_mode")
				this.setLayout("mobile")
			} else {
				window.app.eventBus.emit("desktop_mode")
				this.setLayout("default")
			}
		})

		window.app.eventBus.on("transitionStart", () => {
			this.setState({ isOnTransition: true })
		})
		window.app.eventBus.on("transitionDone", () => {
			this.setState({ isOnTransition: false })
		})
	}

	componentWillUnmount() {
		unenquireScreen(this.enquireHandler)
	}

	render() {
		const layoutComponentProps = {
			...this.props,
			...this.state,
		}

		if (LayoutRenders[this.state.layoutType]) {
			return LayoutRenders[this.state.layoutType](layoutComponentProps)
		}

		return LayoutRenders.default(layoutComponentProps)
	}
}