import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { Motion, spring } from "react-motion"
import { Menu, Avatar, Dropdown, Tag, Empty } from "antd"

import Drawer from "@layouts/components/drawer"

import { Icons, createIconRender } from "@components/Icons"

import sidebarItems from "@config/sidebar"

import "./index.less"

const AppDrawer = (props) => {
	// TODO: Fetch from app core
	const installedApps = []

	return <div className="app-drawer">
		<h1>Apps</h1>

		{
			installedApps.map((item) => {
				return <div
					key={item.key}
					className="app-drawer_item"
					onClick={() => {
						if (item.location) {
							app.location.push(item.location)
						}

						props.close()
					}}
				>
					<h3>{item.icon && createIconRender(item.icon)} {item.label}</h3>
				</div>
			})
		}

		{
			installedApps.length === 0 && <Empty
				description="No apps installed"
				image={Empty.PRESENTED_IMAGE_SIMPLE}
			/>
		}
	</div>
}

const onClickHandlers = {
	apps: () => {
		app.layout.drawer.open("apps", AppDrawer)
	},
	addons: () => {
		window.app.location.push("/addons")
	},
	studio: () => {
		window.app.location.push("/studio")
	},
	settings: () => {
		window.app.navigation.goToSettings()
	},
	notifications: () => {
		window.app.controls.openNotifications()
	},
	search: () => {
		window.app.controls.openSearcher()
	},
	messages: () => {
		window.app.controls.openMessages()
	},
	create: () => {
		window.app.controls.openCreator()
	},
	profile: () => {
		window.app.navigation.goToAccount()
	},
	login: () => {
		window.app.navigation.goAuth()
	},
	logout: () => {
		app.eventBus.emit("app.logout_request")
	}
}

const generateTopItems = (extra = []) => {
	const items = [...sidebarItems, ...extra]

	return items.map((item) => {
		return {
			id: item.id,
			key: item.id,
			path: item.path,
			icon: createIconRender(item.icon),
			label: <Translation>
				{t => t(item.title ?? item.id)}
			</Translation>,
			disabled: item.disabled,
			children: item.children,
		}
	})
}

const BottomMenuDefaultItems = [
	{
		key: "search",
		label: <Translation>
			{(t) => t("Search")}
		</Translation>,
		icon: <Icons.Search />,
	},
	{
		key: "messages",
		label: <Translation>
			{(t) => t("Messages")}
		</Translation>,
		icon: <Icons.MessageCircle />,
	},
	{
		key: "notifications",
		label: <Translation>
			{(t) => t("Notifications")}
		</Translation>,
		icon: <Icons.Bell />,
	},
	{
		key: "apps",
		label: <Translation>
			{(t) => t("Apps")}
		</Translation>,
		icon: <Icons.MdApps />,
	},
	{
		key: "settings",
		label: <Translation>
			{(t) => t("Settings")}
		</Translation>,
		icon: <Icons.Settings />,
	}
]

const ActionMenuItems = [
	{
		key: "profile",
		label: <>
			<Icons.User />
			<Translation>
				{t => t("Profile")}
			</Translation>
		</>,
	},
	{
		key: "studio",
		label: <>
			<Icons.MdHardware />
			<Translation>
				{t => t("Studio")}
			</Translation>
		</>,
	},
	{
		key: "addons",
		label: <>
			<Icons.Box />
			<Translation>
				{t => t("Addons")}
			</Translation>
		</>,
	},
	{
		type: "divider"
	},
	{
		key: "switch_account",
		label: <>
			<Icons.MdSwitchAccount />
			<Translation>
				{t => t("Switch account")}
			</Translation>
		</>,
	},
	{
		key: "logout",
		label: <>
			<Icons.LogOut />
			<Translation>
				{t => t("Logout")}
			</Translation>
		</>,
		danger: true
	}
]

export default class Sidebar extends React.Component {
	state = {
		visible: false,
		expanded: false,

		topItems: generateTopItems(),
		bottomItems: [],

		lockAutocollapse: false,
		navigationRender: null,
	}

	sidebarRef = React.createRef()

	collapseDebounce = null

	interface = window.app.layout.sidebar = {
		toggleVisibility: (to) => {
			this.setState({ visible: to ?? !this.state.visible })
		},
		toggleCollapse: (to, force) => {
			to = to ?? !this.state.expanded

			if (this.collapseDebounce) {
				clearTimeout(this.collapseDebounce)
				this.collapseDebounce = null
			}

			if (!to & this.state.dropdownOpen && !force) {
				// FIXME: This is a walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
				// The desing defines when sidebar should be collapsed, dropdown should be closed, but in this case, gonna to keep it open untils dropdown is closed
				//this.setState({ dropdownOpen: false })

				return false
			}

			if (!to) {
				if (this.state.lockAutocollapse) {
					return false
				}

				this.collapseDebounce = setTimeout(() => {
					this.setState({ expanded: to })
				}, window.app.cores.settings.get("sidebar.collapse_delay_time") ?? 500)
			} else {
				this.setState({ expanded: to })
			}

			app.eventBus.emit("sidebar.expanded", to)
		},
		isVisible: () => this.state.visible,
		isExpanded: () => this.state.expanded,
		renderNavigationBar: (component, options) => {
			this.setState({
				navigationRender: {
					component,
					options,
				}
			})
		},
		updateBottomItemProps: (id, newProps) => {
			let updatedValue = this.state.bottomItems

			updatedValue = updatedValue.map((item) => {
				if (item.id === id) {
					item.props = {
						...item.props,
						...newProps,
					}
				}
			})

			this.setState({
				bottomItems: updatedValue
			})
		},
		attachBottomItem: (id, children, options) => {
			if (!id) {
				throw new Error("ID is required")
			}

			if (!children) {
				throw new Error("Children is required")
			}

			if (this.state.bottomItems.find((item) => item.id === id)) {
				throw new Error("Item already exists")
			}

			let updatedValue = this.state.bottomItems

			updatedValue.push({
				id,
				children,
				...options
			})

			this.setState({
				bottomItems: updatedValue
			})
		},
		removeBottomItem: (id) => {
			let updatedValue = this.state.bottomItems

			updatedValue = updatedValue.filter((item) => item.id !== id)

			this.setState({
				bottomItems: updatedValue
			})
		},
	}

	events = {

	}

	componentDidMount = async () => {
		for (const [event, handler] of Object.entries(this.events)) {
			app.eventBus.on(event, handler)
		}

		setTimeout(() => {
			this.interface.toggleVisibility(true)

			if (app.cores.settings.is("sidebar.collapsable", false)) {
				this.interface.toggleCollapse(true)
			}
		}, 10)
	}

	componentWillUnmount = () => {
		for (const [event, handler] of Object.entries(this.events)) {
			app.eventBus.off(event, handler)
		}

		//delete app.layout.sidebar
	}

	handleClick = (e) => {
		if (e.item.props.ignore_click === "true") {
			return
		}

		if (e.item.props.override_event) {
			return app.eventBus.emit(e.item.props.override_event, e.item.props.override_event_props)
		}

		if (typeof e.key === "undefined") {
			app.eventBus.emit("invalidSidebarKey", e)
			return false
		}

		if (typeof onClickHandlers[e.key] === "function") {
			return onClickHandlers[e.key](e)
		}

		app.cores.sfx.play("sidebar.switch_tab")

		const item = this.state.topItems.find((item) => item.id === e.key)

		return app.location.push(`/${item.path ?? e.key}`, 150)
	}

	onMouseEnter = (event) => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("sidebar.collapsable", false)) {
			if (!this.state.expanded) {
				this.interface.toggleCollapse(true)
			}

			return
		}

		// do nothing if is mask visible
		if (app.layout.drawer.isMaskVisible()) {
			return false
		}

		this.interface.toggleCollapse(true)
	}

	handleMouseLeave = (event) => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("sidebar.collapsable", false)) return

		this.interface.toggleCollapse(false)
	}

	onDropdownOpenChange = (to) => {
		// this is another walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
		if (!to && this.state.expanded) {
			this.interface.toggleCollapse(false, true)
		}

		this.setState({ dropdownOpen: to })
	}

	onClickDropdownItem = (item) => {
		const handler = onClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}

	getBottomItems = () => {
		const items = [
			...BottomMenuDefaultItems,
			...this.state.bottomItems,
		]

		if (app.userData) {
			items.push({
				key: "account",
				ignore_click: "true",
				className: "user_avatar",
				label: <Dropdown
					menu={{
						items: ActionMenuItems,
						onClick: this.onClickDropdownItem
					}}
					autoFocus
					placement="top"
					trigger={["click"]}
				>
					<Avatar shape="square" src={app.userData?.avatar} />
				</Dropdown>,
			})
		}

		if (!app.userData) {
			items.push({
				key: "login",
				label: <Translation>
					{t => t("Login")}
				</Translation>,
				icon: <Icons.LogIn />,
			})
		}

		return items
	}

	render() {
		const defaultSelectedKey = window.location.pathname.replace("/", "")

		return <Motion style={{
			x: spring(!this.state.visible ? 100 : 0),
		}}>
			{({ x }) => {
				return <div
					className={classnames(
						"app_sidebar_wrapper",
						{
							visible: this.state.visible,
						}
					)}
					style={{
						transform: `translateX(-${x}%)`,
					}}
					onMouseEnter={this.onMouseEnter}
					onMouseLeave={this.handleMouseLeave}
				>
					{
						window.__TAURI__ && navigator.platform.includes("Mac") && <div
							className="app_sidebar_tauri"
							data-tauri-drag-region
						/>
					}

					<div
						className={classnames(
							"app_sidebar",
							{
								["expanded"]: this.state.visible && this.state.expanded,
								["hidden"]: !this.state.visible,
							}
						)
						}
						ref={this.sidebarRef}
					>
						<div className="app_sidebar_header">
							<div className="app_sidebar_header_logo">
								<img
									src={config.logo?.alt}
									onClick={() => app.navigation.goMain()}
								/>

								<Tag>Beta</Tag>
							</div>
						</div>

						<div key="menu" className="app_sidebar_menu_wrapper">
							<Menu
								mode="inline"
								onClick={this.handleClick}
								defaultSelectedKeys={[defaultSelectedKey]}
								items={this.state.topItems}
								selectable
							/>
						</div>

						<div
							key="bottom"
							className={classnames(
								"app_sidebar_menu_wrapper",
								"bottom"
							)}
						>
							<Menu
								selectable={false}
								mode="inline"
								onClick={this.handleClick}
								items={this.getBottomItems()}
							/>
						</div>
					</div>

					<Drawer />
				</div>
			}}
		</Motion>
	}
}