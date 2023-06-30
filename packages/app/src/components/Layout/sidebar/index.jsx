import React from "react"
import config from "config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { Motion, spring } from "react-motion"
import { Menu, Avatar, Dropdown } from "antd"

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

const generateTopItems = () => {
	return sidebarItems.map((item) => {
		return {
			key: item.id,
			icon: createIconRender(item.icon),
			label: <Translation>
				{t => t(item.title ?? item.id)}
			</Translation>,
			disabled: item.disabled,
			children: item.children,
		}
	})
}

const ActionMenuItems = [
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

export default class Sidebar extends React.Component {
	state = {
		visible: false,
		expanded: false,

		topItems: generateTopItems(),
		bottomItems: [],
	}

	sidebarRef = React.createRef()

	collapseDebounce = null

	interface = window.app.layout.sidebar = {
		toggleVisibility: this.toggleVisibility,
		toggleCollapse: this.toggleExpanded,
		isVisible: () => this.state.visible,
		isExpanded: () => this.state.expanded,
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

	componentDidMount = async () => {
		setTimeout(() => {
			this.toggleVisibility(true)

			if (app.cores.settings.is("sidebar.collapsable", false)) {
				this.toggleExpanded(true)
			}
		}, 10)
	}

	componentWillUnmount = () => {
		delete app.layout.sidebar
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

		const item = sidebarItems.find((item) => item.id === e.key)

		return window.app.location.push(`/${item.path ?? e.key}`, 150)
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
			}, window.app.cores.settings.get("sidebar.collapse_delay_time") ?? 500)
		} else {
			this.setState({ expanded: to })
		}

		app.eventBus.emit("sidebar.expanded", to)
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	onMouseEnter = () => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("sidebar.collapsable", false)) {
			if (!this.state.expanded) {
				this.toggleExpanded(true)
			}

			return
		}

		this.toggleExpanded(true)
	}

	handleMouseLeave = () => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("sidebar.collapsable", false)) return

		this.toggleExpanded(false)
	}

	onDropdownOpenChange = (to) => {
		// this is another walkaround for a bug in antd, causing when dropdown set to close, item click event is not fired
		if (!to && this.state.expanded) {
			this.toggleExpanded(false, true)
		}

		this.setState({ dropdownOpen: to })
	}

	onClickDropdownItem = (item) => {
		const handler = onClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}

	render() {
		const defaultSelectedKey = window.location.pathname.replace("/", "")

		return <Motion style={{
			x: spring(!this.state.visible ? 100 : 0),
		}}>
			{({ x }) => {
				return <div
					className="app_sidebar_wrapper"
					style={{
						transform: `translateX(-${x}%)`,
					}}
				>
					<div
						onMouseEnter={this.onMouseEnter}
						onMouseLeave={this.handleMouseLeave}
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
								<img src={config.logo?.alt} />
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
							>
								{
									this.state.bottomItems.map((item) => {
										if (item.noContainer) {
											return React.createElement(item.children, item.childrenProps)
										}

										return <Menu.Item
											key={item.id}
											className="extra_bottom_item"
											icon={createIconRender(item.icon)}
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
											items: ActionMenuItems,
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
					</div>
				</div>
			}}
		</Motion>
	}
}