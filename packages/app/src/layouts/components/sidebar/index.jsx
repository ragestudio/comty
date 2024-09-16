import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Avatar, Dropdown, Tag } from "antd"

import Drawer from "@layouts/components/drawer"

import { Icons } from "@components/Icons"

import GenerateMenuItems from "@utils/generateMenuItems"

import TopMenuItems from "@config/sidebar/TopItems"
import BottomMenuItems from "@config/sidebar/BottomItems"

import ItemsClickHandlers from "./itemClickHandlers"

import "./index.less"

const ActionMenuItems = [
	{
		key: "profile",
		label: <>
			<Icons.FiUser />
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
			<Icons.FiBox />
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
			<Icons.FiLogOut />
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

		topItems: GenerateMenuItems(TopMenuItems),
		bottomItems: GenerateMenuItems(BottomMenuItems),

		selectedMenuItem: null,
		navigationRender: null,
	}

	sidebarRef = React.createRef()

	collapseDebounce = null

	interface = window.app.layout.sidebar = {
		toggleVisibility: (to) => {
			if (to === false) {
				this.interface.toggleExpanded(false, {
					instant: true,
				})
			}

			this.setState({ visible: to ?? !this.state.visible })
		},
		toggleExpanded: async (to, { instant = false, isDropdown = false } = {}) => {
			to = to ?? !this.state.expanded

			if (this.collapseDebounce) {
				clearTimeout(this.collapseDebounce)
				this.collapseDebounce = null
			}

			if (to === false & this.state.dropdownOpen === true && isDropdown === true) {
				// FIXME: This is a walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
				// The desing defines when sidebar should be collapsed, dropdown should be closed, but in this case, gonna to keep it open untils dropdown is closed
				//this.setState({ dropdownOpen: false })

				return false
			}

			if (to === false) {
				if (instant === false) {
					await new Promise((resolve) => setTimeout(resolve, window.app.cores.settings.get("sidebar.collapse_delay_time") ?? 500))
				}
			}

			this.setState({ expanded: to })

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
		updateMenuItemProps: this.updateBottomItemProps,
		addMenuItem: this.addMenuItem,
		removeMenuItem: this.removeMenuItem,
	}

	events = {
		"router.navigate": (path) => {
			this.calculateSelectedMenuItem(path)
		},
	}

	componentDidMount = async () => {
		this.calculateSelectedMenuItem(window.location.pathname)

		for (const [event, handler] of Object.entries(this.events)) {
			app.eventBus.on(event, handler)
		}

		setTimeout(() => {
			this.interface.toggleVisibility(true)
		}, 10)
	}

	componentWillUnmount = () => {
		for (const [event, handler] of Object.entries(this.events)) {
			app.eventBus.off(event, handler)
		}

		delete app.layout.sidebar
	}

	calculateSelectedMenuItem = (path) => {
		const items = [...this.state.topItems, ...this.state.bottomItems]

		this.setState({
			selectedMenuItem: items.find((item) => String(item.path).includes(path)),
		})
	}

	addMenuItem = (group, item) => {
		group = this.getMenuItemGroupStateKey(group)

		if (!group) {
			throw new Error("Invalid group")
		}

		const newItems = [...this.state[group], item]

		this.setState({
			[group]: newItems
		})

		return newItems
	}

	removeMenuItem = (group, id) => {
		group = this.getMenuItemGroupStateKey(group)

		if (!group) {
			throw new Error("Invalid group")
		}

		const newItems = this.state[group].filter((item) => item.id !== id)

		this.setState({
			[group]: newItems
		})

		return newItems
	}

	updateBottomItemProps = (group, id, newProps) => {
		group = this.getMenuItemGroupStateKey(group)

		if (!group) {
			throw new Error("Invalid group")
		}

		let updatedValue = this.state[group]

		updatedValue = updatedValue.map((item) => {
			if (item.id === id) {
				item.props = {
					...item.props,
					...newProps,
				}
			}
		})

		this.setState({
			[group]: updatedValue
		})

		return updatedValue
	}

	getMenuItemGroupStateKey = (group) => {
		switch (group) {
			case "top": {
				return "topItems"
			}
			case "bottom": {
				return "bottomItems"
			}
			default: {
				return null
			}
		}
	}

	injectUserItems(items = []) {
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

		} else {
			items.push({
				key: "login",
				label: <Translation>
					{t => t("Login")}
				</Translation>,
				icon: <Icons.FiLogIn />,
			})
		}

		return items
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

		if (typeof ItemsClickHandlers[e.key] === "function") {
			return ItemsClickHandlers[e.key](e)
		}

		app.cores.sfx.play("sidebar.switch_tab")

		let item = [...this.state.topItems, ...this.state.bottomItems].find((item) => item.id === e.key)

		return app.location.push(`/${item.path ?? e.key}`, 150)
	}

	onMouseEnter = () => {
		if (!this.state.visible || app.layout.drawer.isMaskVisible()) {
			return false
		}

		return this.interface.toggleExpanded(true)
	}

	handleMouseLeave = () => {
		if (!this.state.visible) {
			return false
		}

		return this.interface.toggleExpanded(false)
	}

	onDropdownOpenChange = (to) => {
		// this is another walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
		if (!to && this.state.expanded) {
			this.interface.toggleExpanded(false, true)
		}

		this.setState({ dropdownOpen: to })
	}

	onClickDropdownItem = (item) => {
		const handler = ItemsClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}

	render() {
		const selectedKeyId = this.state.selectedMenuItem?.id

		return <div
			className="app_sidebar_wrapper"
			onMouseEnter={this.onMouseEnter}
			onMouseLeave={this.handleMouseLeave}
		>
			{
				window.__TAURI__ && navigator.platform.includes("Mac") && <div
					className="app_sidebar_tauri"
					data-tauri-drag-region
				/>
			}

			<AnimatePresence
				mode="popLayout"
			>
				{
					this.state.visible && <motion.div
						className={classnames(
							"app_sidebar",
							{
								["expanded"]: this.state.expanded,
							}
						)}
						ref={this.sidebarRef}
						initial={{
							x: -500
						}}
						animate={{
							x: 0,
						}}
						exit={{
							x: -500
						}}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20
						}}
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
								selectedKeys={[selectedKeyId]}
								items={this.state.topItems}
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
								mode="inline"
								onClick={this.handleClick}
								items={[...this.state.bottomItems, ...this.injectUserItems()]}
								selectedKeys={[selectedKeyId]}
							/>
						</div>
					</motion.div>
				}
			</AnimatePresence>

			<Drawer />
		</div>
	}
}