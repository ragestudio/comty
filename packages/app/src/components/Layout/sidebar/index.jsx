import React from "react"
import { Menu, Avatar, Button } from "antd"
import { Translation } from "react-i18next"
import classnames from "classnames"

import config from "config"
import { Icons, createIconRender } from "components/Icons"

import sidebarItems from "schemas/routes.json"

import "./index.less"

const onClickHandlers = {
	settings: (event) => {
		window.app.openSettings()
	},
}

const getSidebarComponents = () => {
	const items = {}

	sidebarItems.forEach((item, index) => {
		if (!item.reachable) {
			return
		}

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
			toggleCollapse: this.toggleCollapse,
			isVisible: () => this.state.visible,
			isCollapsed: () => this.state.collapsed,
			setCustomRender: this.setRender,
			closeCustomRender: this.closeRender,
		}

		this.state = {
			visible: false,
			elevated: false,
			collapsed: window.app.settings.get("collapseOnLooseFocus") ?? false,
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
		if (!this.state.visible) return

		if (window.app.settings.is("collapseOnLooseFocus", false)) return

		clearTimeout(this.collapseDebounce)

		this.collapseDebounce = null

		if (this.state.collapsed) {
			this.toggleCollapse(false)
		}
	}

	handleMouseLeave = () => {
		if (!this.state.visible) return

		if (window.app.settings.is("collapseOnLooseFocus", false)) return

		if (!this.state.collapsed) {
			this.collapseDebounce = setTimeout(() => { this.toggleCollapse(true) }, window.app.settings.get("autoCollapseDelay") ?? 500)
		}
	}

	render() {
		if (!this.state.menus) return null

		return (
			<div
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.handleMouseLeave}
				className={
					classnames(
						"app_sidebar",
						{
							["customRender"]: this.state.customRender,
							["floating"]: window.app?.settings.get("sidebar.floating"),
							["collapsed"]: !this.state.customRender && this.state.visible && this.state.collapsed,
							["elevated"]: !this.state.visible && this.state.elevated,
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
							<div className={classnames("app_sidebar_header_logo", { ["collapsed"]: this.state.collapsed })}>
								<img src={this.state.collapsed ? config.logo?.alt : config.logo?.full} />
							</div>
						</div>

						<div key="menu" className="app_sidebar_menu_wrapper">
							<Menu selectable={true} mode="inline" onClick={this.handleClick}>
								{this.renderMenuItems(this.state.menus)}
							</Menu>
						</div>

						<div key="bottom" className={classnames("app_sidebar_menu_wrapper", "bottom")}>
							<Menu selectable={false} mode="inline" onClick={this.handleClick}>
								<Menu.Item key="search" icon={<Icons.Search />} override_event="app.openSearcher" >
									<Translation>
										{(t) => t("Search")}
									</Translation>
								</Menu.Item>
								<Menu.Item key="create" icon={<Icons.PlusCircle />} override_event="app.openCreator" >
									<Translation>
										{(t) => t("Create")}
									</Translation>
								</Menu.Item>
								<Menu.Item key="notifications" icon={<Icons.Bell />} override_event="app.openNotifications">
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
									app.userData && <Menu.Item key="account" className="user_avatar">
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
		)
	}
}