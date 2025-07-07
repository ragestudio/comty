import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, AnimatePresence } from "motion/react"
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
		label: (
			<>
				<Icons.FiUser />
				<Translation>{(t) => t("Profile")}</Translation>
			</>
		),
	},
	{
		key: "studio",
		label: (
			<>
				<Icons.MdHardware />
				<Translation>{(t) => t("Studio")}</Translation>
			</>
		),
	},
	{
		key: "addons",
		label: (
			<>
				<Icons.FiBox />
				<Translation>{(t) => t("Addons")}</Translation>
			</>
		),
	},
	{
		type: "divider",
	},
	{
		key: "switch_account",
		label: (
			<>
				<Icons.MdSwitchAccount />
				<Translation>{(t) => t("Switch account")}</Translation>
			</>
		),
	},
	{
		key: "logout",
		label: (
			<>
				<Icons.FiLogOut />
				<Translation>{(t) => t("Logout")}</Translation>
			</>
		),
		danger: true,
	},
]

export default class Sidebar extends React.Component {
	state = {
		visible: false,
		expanded: false,
		showAccountSwitcher: false,
		switcherUsers: [],
		hoveredUserId: null,
		topItems: GenerateMenuItems(TopMenuItems),
		bottomItems: GenerateMenuItems(BottomMenuItems),

		selectedMenuItem: null,
		navigationRender: null,
	}

	sidebarRef = React.createRef()
	switcherRef = React.createRef()
	collapseDebounce = null

	interface = (window.app.layout.sidebar = {
		toggleVisibility: (to) => {
			if (to === false) {
				this.interface.toggleExpanded(false, { instant: true })
			}
			this.setState({ visible: to ?? !this.state.visible })
		},
		toggleExpanded: async (
			to,
			{ instant = false, isDropdown = false } = {}
		) => {
			to = to ?? !this.state.expanded
			if (this.collapseDebounce) {
				clearTimeout(this.collapseDebounce)
				this.collapseDebounce = null
			}
			if (
				(to === false) & (this.state.dropdownOpen === true) &&
				isDropdown === true
			) {
				return false
			}
			if (to === false && instant === false) {
				await new Promise((resolve) =>
					setTimeout(
						resolve,
						window.app.cores.settings.get(
							"sidebar.collapse_delay_time"
						) ?? 500
					)
				)
			}
			this.setState({ expanded: to })
			app.eventBus.emit("sidebar.expanded", to)
		},
		isVisible: () => this.state.visible,
		isExpanded: () => this.state.expanded,
		renderNavigationBar: (component, options) => {
			this.setState({ navigationRender: { component, options } })
		},
		updateMenuItemProps: this.updateBottomItemProps,
		addMenuItem: this.addMenuItem,
		removeMenuItem: this.removeMenuItem,
	})

	events = {
		"router.navigate": (path) => this.calculateSelectedMenuItem(path),
	}

	componentDidMount = async () => {
		this.calculateSelectedMenuItem(window.location.pathname)

		Object.entries(this.events).forEach(([event, handler]) =>
			app.eventBus.on(event, handler)
		)

		// Escuchar evento para recargar lista de usuarios cuando se actualicen los tokens
		app.eventBus.on("auth:tokens_updated", this.loadSwitcherUsers)

		// Carga inicial de usuarios
		await this.loadSwitcherUsers()

		setTimeout(() => this.interface.toggleVisibility(true), 10)

		document.addEventListener("mousedown", this.handleClickOutside)
	}

	componentWillUnmount = () => {
		Object.entries(this.events).forEach(([event, handler]) =>
			app.eventBus.off(event, handler)
		)
		app.eventBus.off("auth:tokens_updated", this.loadSwitcherUsers) // Quitar listener

		delete app.layout.sidebar
		document.removeEventListener("mousedown", this.handleClickOutside)
	}

	// Método separado para recargar la lista de usuarios
	loadSwitcherUsers = async () => {
		try {
			const users = await app.auth.listAvailableTokens()
			this.setState({ switcherUsers: users })
		} catch (error) {
			console.error("Error cargando usuarios para switcher:", error)
		}
	}
	handleClickOutside = (event) => {
		if (!this.state.showAccountSwitcher) return

		if (
			this.switcherRef.current &&
			this.switcherRef.current.contains(event.target)
		)
			return

		if (
			this.sidebarRef.current &&
			this.sidebarRef.current.contains(event.target)
		)
			return

		this.setState({ showAccountSwitcher: false, switcherExpanded: false })
	}

	calculateSelectedMenuItem = (path) => {
		const items = [...this.state.topItems, ...this.state.bottomItems]
		this.setState({
			selectedMenuItem: items.find((item) =>
				String(item.path).includes(path)
			),
		})
	}

	addMenuItem = (group, item) => {
		const key = this.getMenuItemGroupStateKey(group)
		if (!key) throw new Error("Invalid group")
		const newItems = [...this.state[key], item]
		this.setState({ [key]: newItems })
		return newItems
	}

	removeMenuItem = (group, id) => {
		const key = this.getMenuItemGroupStateKey(group)
		if (!key) throw new Error("Invalid group")
		const newItems = this.state[key].filter((item) => item.id !== id)
		this.setState({ [key]: newItems })
		return newItems
	}

	updateBottomItemProps = (group, id, newProps) => {
		const key = this.getMenuItemGroupStateKey(group)
		if (!key) throw new Error("Invalid group")
		const updatedValue = this.state[key].map((item) => {
			if (item.id === id) {
				item.props = { ...item.props, ...newProps }
			}
			return item
		})
		this.setState({ [key]: updatedValue })
		return updatedValue
	}

	getMenuItemGroupStateKey = (group) => {
		return group === "top"
			? "topItems"
			: group === "bottom"
			? "bottomItems"
			: null
	}

	injectUserItems(items = []) {
		if (app.userData) {
			items.push({
				key: "account",
				ignore_click: "true",
				className: "user_avatar",
				label: (
					<Dropdown
						menu={{
							items: ActionMenuItems,
							onClick: this.onClickDropdownItem,
						}}
						autoFocus
						placement="top"
						trigger={["click"]}
					>
						<Avatar shape="square" src={app.userData?.avatar} />
					</Dropdown>
				),
			})
		} else {
			items.push({
				key: "login",
				label: <Translation>{(t) => t("Login")}</Translation>,
				icon: <Icons.FiLogIn />,
			})
		}
		return items
	}

	handleClick = (e) => {
		if (e.item.props.ignore_click === "true") return
		if (e.item.props.override_event)
			return app.eventBus.emit(
				e.item.props.override_event,
				e.item.props.override_event_props
			)
		if (typeof e.key === "undefined")
			return app.eventBus.emit("invalidSidebarKey", e)
		if (typeof ItemsClickHandlers[e.key] === "function")
			return ItemsClickHandlers[e.key](e)

		app.cores.sfx.play("sidebar.switch_tab")
		const item = [...this.state.topItems, ...this.state.bottomItems].find(
			(item) => item.id === e.key
		)
		return app.location.push(`/${item?.path ?? e.key}`, 150)
	}

	onMouseEnter = () => {
		if (!this.state.visible || app.layout.drawer.isMaskVisible())
			return false
		return this.interface.toggleExpanded(true)
	}

	handleMouseLeave = () => {
		if (!this.state.visible) return false
		return this.interface.toggleExpanded(false)
	}

	onDropdownOpenChange = (to) => {
		if (!to && this.state.expanded) {
			this.interface.toggleExpanded(false, true)
		}
		this.setState({ dropdownOpen: to })
	}

	onClickDropdownItem = (item) => {
		if (item.key === "switch_account") {
			this.setState({ showAccountSwitcher: true })
			return
		}
		const handler = ItemsClickHandlers[item.key]
		if (typeof handler === "function") handler()
	}

	render() {
		const selectedKeyId = this.state.selectedMenuItem?.id

		return (
			<div
				className={classnames("app_sidebar_wrapper", {
					["hidden"]: !this.state.visible,
				})}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.handleMouseLeave}
			>
				{window.__TAURI__ && navigator.platform.includes("Mac") && (
					<div className="app_sidebar_tauri" data-tauri-drag-region />
				)}

				<AnimatePresence mode="popLayout">
					{this.state.visible && (
						<>
							{/* Sidebar Principal */}
							<motion.div
								className={classnames("app_sidebar", {
									expanded: this.state.expanded,
								})}
								ref={this.sidebarRef}
								initial={{ x: -500 }}
								animate={{ x: 0 }}
								exit={{ x: -500 }}
								transition={{
									type: "spring",
									stiffness: 100,
									damping: 20,
								}}
							>
								<div className="app_sidebar_header">
									<div className="app_sidebar_header_logo">
										<img
											src={config.logo?.alt}
											onClick={() =>
												app.navigation.goMain()
											}
										/>
										<Tag>αlpha</Tag>
									</div>
								</div>

								<div
									key="menu"
									className="app_sidebar_menu_wrapper"
								>
									<Menu
										mode="inline"
										onClick={this.handleClick}
										selectedKeys={[selectedKeyId]}
										items={this.state.topItems}
									/>
								</div>

								<div
									key="bottom"
									className="app_sidebar_menu_wrapper bottom"
								>
									<Menu
										mode="inline"
										onClick={this.handleClick}
										items={[
											...this.state.bottomItems,
											...this.injectUserItems(),
										]}
										selectedKeys={[selectedKeyId]}
									/>
								</div>
							</motion.div>

							{/* Sidebar de cambio de cuenta */}
							{this.state.showAccountSwitcher && (
								<motion.div
									className={classnames(
										"app_sidebar_switcher",
										{
											expanded:
												this.state.switcherExpanded,
										}
									)}
									ref={this.switcherRef}
									initial={{ x: -200, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									exit={{ x: 100, opacity: 0 }}
									transition={{
										type: "spring",
										stiffness: 120,
										damping: 20,
									}}
									onMouseEnter={() =>
										this.setState({
											switcherExpanded: true,
										})
									}
									onMouseLeave={() =>
										this.setState({
											switcherExpanded: false,
										})
									}
								>
									<div className="switcher_header">
										{this.state.switcherExpanded ? (
											<>
												<span>Switch Account</span>
											</>
										) : (
											<Icons.MdSwitchAccount size={24} />
										)}
									</div>

									<Menu
										mode="inline"
										selectable={false}
										items={[
											...this.state.switcherUsers.map(
												(user) => ({
													key: user.userId,
													label:
														user.name ||
														`Usuario ${app.userData?.name}`,
													icon: (
														<Avatar
															src={
																app.userData?.avatar ||
																undefined
															}
															alt={user.name}
														>
															{!user.avatar &&
															user.name
																? user.name
																		.charAt(
																			0
																		)
																		.toUpperCase()
																: null}
														</Avatar>
													),
												})
											),
											{
												type: "divider",
											},
											{
												key: "add_account",
												label: "Add Account",
												icon: <Icons.FiPlus />,
											},
										]}
										onClick={async ({ key }) => {
											if (key === "add_account") {
												try {
													await app.auth.login()
												} catch (error) {
													console.error(
														"Error to add account:",
														error
													)
													alert(
														"No es posible añadir cuenta. Por favor, inténtalo más tarde."
													)
												}
												return
											}

											try {
												await app.auth.loadTokenFromUserId(
													key
												)
												await app.auth.initialize()

												this.setState({
													showAccountSwitcher: false,
													switcherExpanded: false,
												})

												app.eventBus.emit(
													"auth:login_success"
												)
											} catch (err) {
												console.error(
													"Error al cambiar de cuenta:",
													err
												)
												alert(
													"No es posible cambiar de cuenta. Por favor, inténtalo más tarde."
												)
											}
										}}
									/>
								</motion.div>
							)}
						</>
					)}
				</AnimatePresence>

				<Drawer />
			</div>
		)
	}
}
