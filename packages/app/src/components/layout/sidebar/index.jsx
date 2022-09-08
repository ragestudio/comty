import React from "react"
import { Layout, Menu, Avatar } from "antd"
import classnames from "classnames"

import config from "config"
import { Icons, createIconRender } from "components/Icons"
import { sidebarKeys as defaultSidebarItems } from "schemas/defaultSettings"
import sidebarItems from "schemas/routes.json"
import { Translation } from "react-i18next"

import { SidebarEditor } from "./components"
import "./index.less"

const { Sider } = Layout

const onClickHandlers = {
	settings: (event) => {
		window.app.openSettings()
	},
}

export default class Sidebar extends React.Component {
	constructor(props) {
		super(props)

		this.controller = window.app["SidebarController"] = {
			toggleVisibility: this.toggleVisibility,
			toggleEdit: this.toggleEditMode,
			toggleElevation: this.toggleElevation,
			attachElement: this.attachElement,
			isVisible: () => this.state.visible,
			isEditMode: () => this.state.visible,
			isCollapsed: () => this.state.collapsed,
		}

		this.state = {
			editMode: false,
			visible: false,
			loading: true,
			collapsed: window.app.settings.get("collapseOnLooseFocus") ?? false,
			pathResolve: {},
			menus: {},
			extraItems: {
				bottom: [],
				top: [],
			},
			elevated: false,
			additionalElements: [],
		}

		window.app.eventBus.on("edit_sidebar", () => this.toggleEditMode())

		window.app.eventBus.on("settingChanged.sidebar_collapse", (value) => {
			this.toggleCollapse(value)
		})

		// handle sidedrawer open/close
		window.app.eventBus.on("sidedrawer.hasDrawers", () => {
			this.toggleElevation(true)
		})
		window.app.eventBus.on("sidedrawer.noDrawers", () => {
			this.toggleElevation(false)
		})
	}

	collapseDebounce = null

	componentDidMount = async () => {
		await this.loadSidebarItems()

		setTimeout(() => {
			this.controller.toggleVisibility(true)
		}, 100)
	}

	getStoragedKeys = () => {
		return window.app.settings.get("sidebarKeys")
	}

	attachElement = (element) => {
		this.setState({
			additionalElements: [...this.state.additionalElements, element],
		})
	}

	appendItem = (item = {}) => {
		const { position } = item

		if (typeof position === "undefined" && typeof this.state.extraItems[position] === "undefined") {
			console.error("Invalid position")
			return false
		}

		const state = this.state.extraItems

		state[position].push(item)

		this.setState({ extraItems: state })
	}

	loadSidebarItems = () => {
		const items = {}
		const itemsMap = []

		// parse all items from schema
		sidebarItems.forEach((item, index) => {
			items[item.id] = {
				...item,
				index,
				content: (
					<>
						{createIconRender(item.icon)} {item.title}
					</>
				),
			}
		})

		// filter undefined to avoid error
		let keys = (this.getStoragedKeys() ?? defaultSidebarItems).filter((key) => {
			if (typeof items[key] !== "undefined") {
				return true
			}
		})

		// short items
		keys.forEach((id, index) => {
			const item = items[id]

			if (item.locked) {
				if (item.index !== index) {
					keys = keys.move(index, item.index)

					//update index
					window.app.settings.set("sidebarKeys", keys)
				}
			}
		})

		// set items from scoped keys
		keys.forEach((key, index) => {
			const item = items[key]

			try {
				// avoid if item is duplicated
				if (itemsMap.includes(item)) {
					return false
				}

				let valid = true

				if (typeof item.requireState === "object") {
					const { key, value } = item.requireState
					//* TODO: check global state
				}

				// end validation
				if (!valid) {
					return false
				}

				if (typeof item.path !== "undefined") {
					let resolvers = this.state.pathResolve ?? {}
					resolvers[item.id] = item.path
					this.setState({ pathResolve: resolvers })
				}

				itemsMap.push(item)
			} catch (error) {
				return console.log(error)
			}
		})

		// update states
		this.setState({ items, menus: itemsMap, loading: false })
	}

	renderMenuItems(items) {
		const handleRenderIcon = (icon) => {
			if (typeof icon === "undefined") {
				return null
			}
			return createIconRender(icon)
		}

		return items.map((item) => {
			if (Array.isArray(item.children)) {
				return (
					<Menu.SubMenu
						key={item.id}
						icon={handleRenderIcon(item.icon)}
						title={<span>
							<Translation>
								{t => t(item.title)}
							</Translation>
						</span>}
						{...item.props}
					>
						{this.renderMenuItems(item.children)}
					</Menu.SubMenu>
				)
			}

			return (
				<Menu.Item key={item.id} icon={handleRenderIcon(item.icon)} {...item.props}>
					<Translation>
						{t => t(item.title ?? item.id)}
					</Translation>
				</Menu.Item>
			)
		})
	}

	handleClick = (e) => {
		if (typeof e.key === "undefined") {
			window.app.eventBus.emit("invalidSidebarKey", e)
			return false
		}

		if (typeof onClickHandlers[e.key] === "function") {
			return onClickHandlers[e.key](e)
		}
		if (typeof this.state.pathResolve[e.key] !== "undefined") {
			return window.app.setLocation(`/${this.state.pathResolve[e.key]}`, 150)
		}

		return window.app.setLocation(`/${e.key}`, 150)
	}

	toggleEditMode = (to) => {
		if (typeof to === "undefined") {
			to = !this.state.editMode
		}

		if (to) {
			window.app.eventBus.emit("clearAllOverlays")
		} else {
			if (this.itemsMap !== this.getStoragedKeys()) {
				this.loadSidebarItems()
			}
		}

		this.setState({ editMode: to, collapsed: false })
	}

	toggleCollapse = (to) => {
		if (!this.state.editMode) {
			this.setState({ collapsed: to ?? !this.state.collapsed })
		}
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	toggleElevation = (to) => {
		this.setState({ elevated: to ?? !this.state.elevated })
	}

	onMouseEnter = () => {
		if (window.app.settings.is("collapseOnLooseFocus", false)) {
			return false
		}

		clearTimeout(this.collapseDebounce)
		this.collapseDebounce = null

		if (this.state.collapsed) {
			this.toggleCollapse(false)
		}
	}

	handleMouseLeave = () => {
		if (window.app.settings.is("collapseOnLooseFocus", false)) {
			return false
		}

		if (!this.state.collapsed) {
			this.collapseDebounce = setTimeout(() => { this.toggleCollapse(true) }, window.app.settings.get("autoCollapseDelay") ?? 500)
		}
	}

	renderExtraItems = (position) => {
		return this.state.extraItems[position].map((item = {}) => {
			if (typeof item.icon !== "undefined") {
				if (typeof item.props !== "object") {
					item.props = Object()
				}

				item.props["icon"] = createIconRender(item.icon)
			}

			return <Menu.Item key={item.id} {...item.props}>{item.children}</Menu.Item>
		})
	}

	render() {
		if (this.state.loading) return null

		const { user } = this.props

		return (
			<Sider
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.handleMouseLeave}
				theme={this.props.theme}
				width={this.state.editMode ? 400 : 200}
				collapsed={this.state.editMode ? false : this.state.collapsed}
				onCollapse={() => this.props.onCollapse()}
				className={
					classnames(
						"sidebar",
						{
							["edit_mode"]: this.state.editMode,
							["hidden"]: !this.state.visible,
							["elevated"]: this.state.elevated
						}
					)
				}
			>
				<div className="app_sidebar_header">
					<div className={classnames("app_sidebar_header_logo", { ["collapsed"]: this.state.collapsed })}>
						<img src={this.state.collapsed ? config.logo?.alt : config.logo?.full} />
					</div>
				</div>

				{this.state.editMode && (
					<div style={{ height: "100%" }}>
						<SidebarEditor />
					</div>
				)}

				{!this.state.editMode && (
					<div key="menu" className="app_sidebar_menu">
						<Menu selectable={true} mode="inline" theme={this.props.theme} onClick={this.handleClick}>
							{this.renderMenuItems(this.state.menus)}
							{this.renderExtraItems("top")}
						</Menu>
					</div>
				)}

				{!this.state.editMode && <div key="additionalElements" className="additionalElements">
					{this.state.additionalElements}
				</div>}

				{!this.state.editMode && (
					<div key="bottom" className="app_sidebar_bottom">
						<Menu selectable={false} mode="inline" theme={this.props.theme} onClick={this.handleClick}>
							<Menu.Item key="notifications" icon={<Icons.Bell />}>
								<Translation>
									{t => t("Notifications")}
								</Translation>
							</Menu.Item>
							<Menu.Item key="settings" icon={<Icons.Settings />}>
								<Translation>
									{t => t("Settings")}
								</Translation>
							</Menu.Item>

							<Menu.Item key="account">
								<div className="user_avatar">
									<Avatar shape="square" src={user?.avatar} />
								</div>
							</Menu.Item>

							{this.renderExtraItems("bottom")}
						</Menu>
					</div>
				)}
			</Sider>
		)
	}
}