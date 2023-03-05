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
		}

		this.state = {
			visible: false,
			elevated: false,
			expanded: false,
			pathResolvers: null,
			menus: null,

			customRenderTitle: null,
			customRender: null,
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
		const handleRenderIcon = (icon) => {
			if (typeof icon === "undefined") {
				return null
			}
			return createIconRender(icon)
		}

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
				>
					{this.renderMenuItems(item.children)}
				</Menu.SubMenu>
			}

			return <Menu.Item key={item.id} icon={handleRenderIcon(item.icon)} {...item.props}>
				<Translation>
					{t => t(item.title ?? item.id)}
				</Translation>
			</Menu.Item>
		})
	}

	handleClick = (e) => {
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

		if (typeof this.state.pathResolvers === "object") {
			if (typeof this.state.pathResolvers[e.key] !== "undefined") {
				return window.app.setLocation(`/${this.state.pathResolvers[e.key]}`, 150)
			}
		}

		return window.app.setLocation(`/${e.key}`, 150)
	}

	toggleExpanded = (to) => {
		this.setState({ expanded: to ?? !this.state.expanded })
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

		clearTimeout(this.collapseDebounce)

		this.collapseDebounce = null

		if (!this.state.expanded) {
			this.toggleExpanded(true)
		}
	}

	handleMouseLeave = () => {
		if (!this.state.visible) return

		if (window.app.cores.settings.is("collapseOnLooseFocus", false)) return

		if (this.state.expanded) {
			this.collapseDebounce = setTimeout(() => {
				this.toggleExpanded(false)
			}, window.app.cores.settings.get("autoCollapseDelay") ?? 500)
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
								app.userData && <Menu.Item
									key="account"
									className="user_avatar"
									onClick={() => {
										window.app.navigation.goToAccount()
									}}
								>
									<Avatar shape="square" src={app.userData?.avatar} />
								</Menu.Item>
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