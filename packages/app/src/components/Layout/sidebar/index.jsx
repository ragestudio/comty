import React from "react"
import { Menu, Avatar, Button, Dropdown } from "antd"
import { Translation } from "react-i18next"
import classnames from "classnames"

import config from "config"
import { Icons, createIconRender } from "components/Icons"

import sidebarItems from "schemas/sidebar"

import "./index.less"

const onClickHandlers = {
	settings: () => {
		window.app.navigation.goToSettings()
	},
	notifications: () => {
		window.app.controls.openNotifications()
	},
	search: () => {
		window.app.controls.openSearcher()
	},
	create: () => {
		window.app.controls.openCreator()
	},
	account: () => {
		window.app.navigation.goToAccount()
	},
	login: () => {
		window.app.navigation.goAuth()
	},
	logout: () => {
		app.eventBus.emit("app.logout_request")
	}
}

const getSidebarComponents = () => {
	const items = {}

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

	return items
}

const generateItems = () => {
	const components = getSidebarComponents()

	const itemsMap = []
	const pathResolvers = {}

	Object.keys(components).forEach((key, index) => {
		const component = components[key]

		if (typeof component.path !== "undefined") {
			pathResolvers[component.id] = component.path
		}

		itemsMap.push(component)
	})

	return {
		itemsMap,
		pathResolvers,
	}
}

const CustomRender = (props) => {
	const handleClickOutside = (event) => {
		if (props.sidebarRef.current && !props.sidebarRef.current.contains(event.target)) {
			if (event.target.closest(".ant-select-item")) {
				return
			}

			props.closeRender()
		}
	}

	React.useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside)

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [])

	return <div className="render_content_wrapper">
		<div className="render_content_header">
			{
				props.customRenderTitle ?? null
			}
			<Button
				onClick={props.closeRender}
			>
				Close
			</Button>
		</div>
		<div className="render_content">
			{props.children}
		</div>
	</div>
}

const handleRenderIcon = (icon) => {
	if (typeof icon === "undefined") {
		return null
	}
	return createIconRender(icon)
}

export default class Sidebar extends React.Component {
	constructor(props) {
		super(props)

		this.controller = window.app["SidebarController"] = {
			toggleVisibility: this.toggleVisibility,
			toggleElevation: this.toggleElevation,
			toggleCollapse: this.toggleExpanded,
			isVisible: () => this.state.visible,
			isExpanded: () => this.state.expanded,
			setCustomRender: this.setRender,
			closeCustomRender: this.closeRender,
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
			}
		}

		this.state = {
			visible: false,
			elevated: false,
			expanded: false,
			dropdownOpen: false,
			pathResolvers: null,
			menus: null,

			customRenderTitle: null,
			customRender: null,

			bottomItems: [],
		}

		// handle sidedrawer open/close
		window.app.eventBus.on("sidedrawer.hasDrawers", () => {
			this.toggleElevation(true)
		})
		window.app.eventBus.on("sidedrawer.noDrawers", () => {
			this.toggleElevation(false)
		})
	}

	sidebarRef = React.createRef()

	collapseDebounce = null

	componentDidMount = async () => {
		await this.loadItems()

		setTimeout(() => {
			this.controller.toggleVisibility(true)
		}, 100)
	}

	setRender = async (render, options = {}) => {
		if (!typeof render === "function") {
			throw new Error("Render is required to be a function")
		}

		await this.setState({
			customRenderTitle: <div className="render_content_header_title">
				{
					options.icon && createIconRender(options.icon)
				}
				{
					options.title && <h1>
						<Translation>
							{t => t(options.title)}
						</Translation>
					</h1>
				}
			</div>,
			customRender: React.createElement(render, {
				...options.props ?? {},
				close: this.closeRender,
			})
		})
	}

	closeRender = () => {
		this.setState({
			customRenderTitle: null,
			customRender: null,
		})
	}

	loadItems = async () => {
		const generation = generateItems()

		// update states
		await this.setState({
			menus: generation.itemsMap,
			pathResolvers: generation.pathResolvers,
		})
	}

	renderMenuItems(items) {
		return items.map((item) => {
			if (Array.isArray(item.children)) {
				return <Menu.SubMenu
					key={item.id}
					icon={handleRenderIcon(item.icon)}
					title={<span>
						<Translation>
							{t => t(item.title)}
						</Translation>
					</span>}
					{...item.props}
					disabled={item.disabled ?? false}
				>
					{this.renderMenuItems(item.children)}
				</Menu.SubMenu>
			}

			return <Menu.Item
				key={item.id}
				icon={handleRenderIcon(item.icon)}
				disabled={item.disabled ?? false}
				{...item.props}
			>
				<Translation>
					{t => t(item.title ?? item.id)}
				</Translation>
			</Menu.Item>
		})
	}

	handleClick = (e) => {
		if (e.item.props.ignoreClick) {
			return
		}

		if (e.item.props.override_event) {
			return app.eventBus.emit(e.item.props.override_event, e.item.props.override_event_props)
		}

		if (typeof e.key === "undefined") {
			window.app.eventBus.emit("invalidSidebarKey", e)
			return false
		}

		if (typeof onClickHandlers[e.key] === "function") {
			return onClickHandlers[e.key](e)
		}

		window.app.cores.sound.useUIAudio("sidebar.switch_tab")

		if (typeof this.state.pathResolvers === "object") {
			if (typeof this.state.pathResolvers[e.key] !== "undefined") {
				return window.app.setLocation(`/${this.state.pathResolvers[e.key]}`, 150)
			}
		}

		return window.app.setLocation(`/${e.key}`, 150)
	}

	toggleExpanded = (to, force) => {
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
			this.collapseDebounce = setTimeout(() => {
				this.setState({ expanded: to })
			}, window.app.cores.settings.get("autoCollapseDelay") ?? 500)
		} else {
			this.setState({ expanded: to })
		}

		app.eventBus.emit("sidebar.expanded", to)
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	toggleElevation = (to) => {
		this.setState({ elevated: to ?? !this.state.elevated })
	}

	onMouseEnter = () => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("collapseOnLooseFocus", false)) return

		this.toggleExpanded(true)
	}

	handleMouseLeave = () => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("collapseOnLooseFocus", false)) return

		this.toggleExpanded(false)
	}

	onDropdownOpenChange = (to) => {
		// this is another walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
		if (!to && this.state.expanded) {
			this.toggleExpanded(false, true)
		}

		this.setState({ dropdownOpen: to })
	}

	generateDropdownItems = () => {
		return [
			{
				key: "account",
				label: <>
					<Icons.User />
					<Translation>
						{t => t("Account")}
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
	}

	onClickDropdownItem = (item) => {
		const handler = onClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}

	render() {
		if (!this.state.menus) return null

		const defaultSelectedKey = window.location.pathname.replace("/", "")

		return <div
			onMouseEnter={this.onMouseEnter}
			onMouseLeave={this.handleMouseLeave}
			className={
				classnames(
					"app_sidebar",
					{
						["customRender"]: this.state.customRender,
						["floating"]: window.app?.cores.settings.get("sidebar.floating"),
						["elevated"]: this.state.visible && this.state.elevated,
						["expanded"]: this.state.visible && this.state.expanded,
						["hidden"]: !this.state.visible,
					}
				)
			}
			ref={this.sidebarRef}
		>
			{
				this.state.customRender && <CustomRender
					customRenderTitle={this.state.customRenderTitle}
					closeRender={this.closeRender}
					sidebarRef={this.sidebarRef}
				>
					{this.state.customRender}
				</CustomRender>
			}

			{
				!this.state.customRender && <>
					<div className="app_sidebar_header">
						<div className="app_sidebar_header_logo">
							<img src={config.logo?.alt} />
						</div>
					</div>

					<div key="menu" className="app_sidebar_menu_wrapper">
						<Menu
							selectable={true}
							mode="inline"
							onClick={this.handleClick}
							defaultSelectedKeys={[defaultSelectedKey]}
						>
							{this.renderMenuItems(this.state.menus)}
						</Menu>
					</div>

					<div key="bottom" className={classnames("app_sidebar_menu_wrapper", "bottom")}>
						<Menu selectable={false} mode="inline" onClick={this.handleClick}>
							{
								this.state.bottomItems.map((item) => {
									if (item.noContainer) {
										return React.createElement(item.children, item.childrenProps)
									}

									return <Menu.Item
										key={item.id}
										className="extra_bottom_item"
										icon={handleRenderIcon(item.icon)}
										disabled={item.disabled ?? false}
										{...item.containerProps}
									>
										{
											React.createElement(item.children, item.childrenProps)
										}
									</Menu.Item>
								})
							}
							<Menu.Item key="search" icon={<Icons.Search />} >
								<Translation>
									{(t) => t("Search")}
								</Translation>
							</Menu.Item>
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
							{
								app.userData && <Dropdown
									menu={{
										items: this.generateDropdownItems(),
										onClick: this.onClickDropdownItem
									}}
									autoFocus
									placement="top"
									trigger={["click"]}
									onOpenChange={this.onDropdownOpenChange}
								>
									<Menu.Item
										key="account"
										className="user_avatar"
										ignoreClick
									>
										<Avatar shape="square" src={app.userData?.avatar} />
									</Menu.Item>
								</Dropdown>
							}
							{
								!app.userData && <Menu.Item key="login" icon={<Icons.LogIn />}>
									<Translation>
										{t => t("Login")}
									</Translation>
								</Menu.Item>
							}
						</Menu>
					</div>
				</>
			}
		</div>
	}
}