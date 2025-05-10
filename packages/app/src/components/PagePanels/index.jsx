import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "@components/Icons"

import NavMenu from "./components/NavMenu"

import "./index.less"

export class Tab extends React.Component {
	state = {
		error: null,
	}

	componentDidCatch(err) {
		this.setState({ error: err })
	}

	render() {
		if (this.state.error) {
			return (
				<antd.Result
					status="error"
					title="Error"
					subTitle={this.state.error}
				/>
			)
		}
		return <>{this.props.children}</>
	}
}

export const Panel = (props) => {
	return (
		<div
			{...(props.props ?? {})}
			className={classnames("panel", props.align, props.className)}
		>
			{props.children}
		</div>
	)
}

export class PagePanelWithNavMenu extends React.Component {
	state = {
		activeTab:
			new URLSearchParams(window.location.search).get("type") ??
			this.props.defaultTab ??
			this.props.tabs[0]?.key,
		renders: [],
	}

	primaryPanelRef = React.createRef()

	interface = {
		attachComponent: (id, component, options) => {
			this.setState((prevState) => ({
				renders: [
					...prevState.renders,
					{
						id: id,
						component: component,
						options: options,
						ref: React.createRef(),
					},
				],
			}))
		},
		detachComponent: (id) => {
			this.setState((prevState) => ({
				renders: prevState.renders.filter((render) => render.id !== id),
			}))
		},
	}

	updateLayoutHeaderAndTopBar = () => {
		const navMenuItems = this.getItems([
			...(this.props.tabs ?? []),
			...(this.props.extraItems ?? []),
		])

		const mobileNavMenuItems = this.getItems(this.props.tabs ?? [])

		if (app.isMobile) {
			if (mobileNavMenuItems.length > 0) {
				app.layout.top_bar.render(
					<NavMenu
						activeKey={this.state.activeTab}
						items={mobileNavMenuItems}
						onClickItem={(key) => this.handleTabChange(key)}
					/>,
				)
			} else {
				app.layout.top_bar.renderDefault()
			}
		} else {
			if (
				navMenuItems.length > 0 ||
				this.state.renders.length > 0 ||
				this.props.navMenuHeader
			) {
				app.layout.header.render(
					<NavMenu
						header={this.props.navMenuHeader}
						activeKey={this.state.activeTab}
						items={navMenuItems}
						onClickItem={(key) => this.handleTabChange(key)}
						renderNames
					>
						{this.state.renders.map((renderItem) =>
							React.createElement(renderItem.component, {
								...(renderItem.options.props ?? {}),
								ref: renderItem.ref,
								key: renderItem.id,
							}),
						)}
					</NavMenu>,
				)
			} else {
				app.layout.header.render(null)
			}
		}
	}

	componentDidMount() {
		app.layout.page_panels = this.interface

		if (app.isMobile) {
			app.layout.top_bar.shouldUseTopBarSpacer(true)
			app.layout.toggleCenteredContent(false)
		} else {
			app.layout.toggleCenteredContent(true)
		}

		this.updateLayoutHeaderAndTopBar()
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			prevState.activeTab !== this.state.activeTab ||
			prevProps.tabs !== this.props.tabs ||
			prevProps.extraItems !== this.props.extraItems ||
			prevState.renders !== this.state.renders ||
			prevProps.navMenuHeader !== this.props.navMenuHeader ||
			prevProps.defaultTab !== this.props.defaultTab
		) {
			this.updateLayoutHeaderAndTopBar()
		}
	}

	componentWillUnmount() {
		delete app.layout.page_panels

		if (!app.isMobile) {
			if (app.layout.header) {
				app.layout.header.render(null)
			}
		} else {
			if (app.layout.top_bar) {
				app.layout.top_bar.renderDefault()
			}
		}
	}

	renderActiveTab() {
		if (!Array.isArray(this.props.tabs)) {
			console.error("PagePanelWithNavMenu: tabs must be an array")
			return <></>
		}

		if (this.props.tabs.length === 0 && !this.state.activeTab) {
			return <></>
		}

		if (!this.state.activeTab) {
			const firstTabKey = this.props.tabs[0]?.key

			if (firstTabKey) {
				console.error("PagePanelWithNavMenu: activeTab is not defined")
				return (
					<antd.Result
						status="404"
						title="404"
						subTitle="Sorry, the tab you visited does not exist (activeTab not set)."
					/>
				)
			}
			return <></>
		}

		let tab = null

		const activeTabDirectory = this.state.activeTab.split(".")

		activeTabDirectory.forEach((key, index) => {
			if (!tab) {
				tab = this.props.tabs.find((children) => children.key === key)
			} else {
				if (!tab.children) {
					console.error(
						"PagePanelWithNavMenu: tab.children is not defined",
					)
					return (tab = null)
				}
				tab = tab.children.find(
					(children) =>
						children.key ===
						`${activeTabDirectory.slice(0, index).join(".")}.${key}`,
				)
			}
		})

		if (!tab) {
			if (this.props.onNotFound) {
				return this.props.onNotFound()
			}
			return (
				<antd.Result
					status="404"
					title="404"
					subTitle="Sorry, the tab you visited does not exist."
				/>
			)
		}

		const componentProps = tab.props ?? this.props.tabProps
		return React.createElement(tab.component, {
			...componentProps,
		})
	}

	replaceQueryTypeToCurrentTab = (key) => {
		history.pushState(undefined, "", `?type=${key ?? this.state.activeTab}`)
	}

	tabChange = async (key) => {
		if (this.props.beforeTabChange) {
			await this.props.beforeTabChange(key)
		}

		this.setState({ activeTab: key })

		if (this.props.useSetQueryType) {
			this.replaceQueryTypeToCurrentTab(key)
		}

		if (this.props.onTabChange) {
			this.props.onTabChange(key)
		}
	}

	handleTabChange = async (key) => {
		if (this.state.activeTab === key) return

		if (this.props.transition) {
			if (document.startViewTransition) {
				document.startViewTransition(() => {
					this.tabChange(key)
				})

				return
			}

			console.warn(
				"PagePanelWithNavMenu: transition is enabled but document.startViewTransition is not compatible with your browser",
			)

			if (
				this.primaryPanelRef.current &&
				this.primaryPanelRef.current?.classList
			) {
				this.primaryPanelRef.current.classList.add("fade-opacity-leave")
				setTimeout(() => {
					if (this.primaryPanelRef.current) {
						this.primaryPanelRef.current.classList.remove(
							"fade-opacity-leave",
						)
					}
				}, 300)
			}
			await new Promise((resolve) => setTimeout(resolve, 200))
		}
		return this.tabChange(key)
	}

	getItems = (items) => {
		if (!Array.isArray(items)) {
			console.error(
				`[items] is not an (array), received (${typeof items})`,
			)
			return []
		}
		return items.map((item) => ({
			key: item.key,
			icon: createIconRender(item.icon),
			label: item.label,
			children: item.children && this.getItems(item.children),
			disabled: item.disabled,
			props: item.props ?? {},
		}))
	}

	render() {
		return (
			<>
				<div className="pagePanels">
					<div className="panel" ref={this.primaryPanelRef}>
						{this.renderActiveTab()}
					</div>
				</div>
			</>
		)
	}
}

export default PagePanelWithNavMenu
