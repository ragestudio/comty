import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, AnimatePresence, usePresence } from "motion/react"
import { Menu, Avatar, Dropdown, Tag } from "antd"

import { Icons } from "@components/Icons"
import ProductChannelBadge from "@components/ProductChannelBadge"

import GenerateMenuItems from "@utils/generateMenuItems"
import useLayoutInterface from "@hooks/useLayoutInterface"

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
		key: "settings",
		label: (
			<>
				<Icons.FiSettings />
				<Translation>{(t) => t("Settings")}</Translation>
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

export function authorizedItems({ onClickDropdownItem, onDropdownOpenChange }) {
	let items = []

	if (app.userData) {
		items.push({
			key: "account",
			ignore_click: "true",
			className: "user_avatar",
			label: (
				<Dropdown
					menu={{
						items: ActionMenuItems,
						onClick: onClickDropdownItem,
					}}
					autoFocus
					placement="top"
					trigger={["click"]}
					onOpenChange={onDropdownOpenChange}
				>
					<Avatar
						shape="square"
						src={app.userData?.avatar}
					/>
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

const Sidebar = ({
	expanded,
	topItems,
	bottomItems,
	selectedMenuItem,
	onMouseEnter,
	onMouseLeave,
	onHandleClick,
	onDropdownOpenChange,
	onClickDropdownItem,
	dropdownOpen,
}) => {
	const [isPresent] = usePresence()
	const [hidden, setHidden] = React.useState(false)
	const sidebarRef = React.useRef()

	const handleOnMouseEnter = () => {
		if (hidden) {
			return null
		}

		return onMouseEnter()
	}

	const handleOnMouseLeave = () => {
		if (hidden) {
			return null
		}

		return onMouseLeave()
	}

	const selectedKeyId = selectedMenuItem?.id

	return (
		<motion.div
			className={classnames("app_sidebar_wrapper", {
				hidden: hidden,
			})}
			onMouseEnter={handleOnMouseEnter}
			onMouseLeave={handleOnMouseLeave}
			onAnimationStart={() => {
				setHidden(true)
			}}
			onAnimationComplete={() => {
				setHidden(!isPresent)
			}}
			animate={{
				x: 0,
				width: "100%",
				minWidth: app.cores.style.vars["sidebar_wrapper_fixed_width"],
				padding: app.cores.style.vars["sidebar_wrapper_padding"],
				//paddingRight: 0,
			}}
			initial={{
				x: "-100%",
				width: "0%",
				minWidth: 0,
				padding: 0,
				//paddingRight: 0,
			}}
			exit={{
				x: "-100%",
				width: "0%",
				minWidth: 0,
				padding: 0,
				//paddingRight: 0,
			}}
			transition={{
				type: "spring",
				stiffness: 100,
				damping: 20,
			}}
		>
			<div
				className={classnames("app_sidebar bg-accent", {
					["expanded"]: expanded,
				})}
				ref={sidebarRef}
			>
				<div className="app_sidebar_header">
					<div className="app_sidebar_header_logo">
						<img
							src={config.logo?.alt}
							onClick={() => app.navigation.goMain()}
						/>

						<ProductChannelBadge />
					</div>
				</div>

				<div
					key="menu"
					className="app_sidebar_menu_wrapper"
				>
					<Menu
						mode="inline"
						onClick={onHandleClick}
						selectedKeys={[selectedKeyId]}
						items={topItems}
					/>
				</div>

				<div
					key="bottom"
					className={classnames("app_sidebar_menu_wrapper", "bottom")}
				>
					<Menu
						mode="inline"
						onClick={onHandleClick}
						items={[
							...bottomItems,
							...authorizedItems({
								onClickDropdownItem,
								onDropdownOpenChange,
							}),
						]}
						selectedKeys={[selectedKeyId]}
					/>
				</div>
			</div>
		</motion.div>
	)
}

const SidebarWrapper = () => {
	const [visible, setVisible] = React.useState(false)
	const [expanded, setExpanded] = React.useState(false)
	const [topItems, setTopItems] = React.useState(() =>
		GenerateMenuItems(TopMenuItems),
	)
	const [bottomItems, setBottomItems] = React.useState(() =>
		GenerateMenuItems(BottomMenuItems),
	)
	const [selectedMenuItem, setSelectedMenuItem] = React.useState(null)
	const [dropdownOpen, setDropdownOpen] = React.useState(false)

	const collapseDebounceRef = React.useRef(null)

	const calculateSelectedMenuItem = React.useCallback(
		(path) => {
			const items = [...topItems, ...bottomItems]

			setSelectedMenuItem(
				items.find((item) => String(path).includes(item.path)),
			)
		},
		[topItems, bottomItems],
	)

	const getMenuItemGroupStateKey = React.useCallback((group) => {
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
	}, [])

	const addMenuItem = React.useCallback(
		(group, item) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				const newItems = [...prev, item]
				return newItems
			})
		},
		[getMenuItemGroupStateKey],
	)

	const removeMenuItem = React.useCallback(
		(group, id) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				const newItems = prev.filter((item) => item.id !== id)
				return newItems
			})
		},
		[getMenuItemGroupStateKey],
	)

	const updateMenuItemProps = React.useCallback(
		(group, id, newProps) => {
			const groupKey = getMenuItemGroupStateKey(group)

			if (!groupKey) {
				throw new Error("Invalid group")
			}

			const setterMap = {
				topItems: setTopItems,
				bottomItems: setBottomItems,
			}

			const setter = setterMap[groupKey]

			setter((prev) => {
				return prev.map((item) => {
					if (item.id === id) {
						return {
							...item,
							props: {
								...item.props,
								...newProps,
							},
						}
					}
					return item
				})
			})
		},
		[getMenuItemGroupStateKey],
	)

	const toggleExpanded = React.useCallback(
		(to) => {
			to = to ?? !expanded

			setExpanded(to)

			app.layout.toggleRootContainerClassname("sidebar-expanded", to)

			app.eventBus.emit("sidebar.expanded", to)
		},
		[expanded, dropdownOpen],
	)

	const toggleVisibility = React.useCallback(
		(to) => {
			if (to === false) {
				toggleExpanded(false, {
					instant: true,
				})
			}

			setVisible((prev) => to ?? !prev)
		},
		[toggleExpanded],
	)

	// create the layout interface
	useLayoutInterface("sidebar", {
		toggleVisibility,
		toggleExpanded,
		isVisible: () => visible,
		isExpanded: () => expanded,
		updateMenuItemProps,
		addMenuItem,
		removeMenuItem,
	})

	// Event handlers
	const handleClick = React.useCallback(
		(e) => {
			if (e.item.props.ignore_click === "true") {
				return
			}

			if (e.item.props.override_event) {
				return app.eventBus.emit(
					e.item.props.override_event,
					e.item.props.override_event_props,
				)
			}

			if (typeof e.key === "undefined") {
				app.eventBus.emit("invalidSidebarKey", e)
				return false
			}

			if (typeof ItemsClickHandlers[e.key] === "function") {
				return ItemsClickHandlers[e.key](e)
			}

			app.cores.sfx.play("sidebar.switch_tab")

			let item = [...topItems, ...bottomItems].find(
				(item) => item.id === e.key,
			)

			return app.location.push(`/${item.path ?? e.key}`, 150)
		},
		[topItems, bottomItems],
	)

	const handleMouseEnter = React.useCallback(() => {
		if (!visible || app.layout.drawer.isMaskVisible() || dropdownOpen) {
			return false
		}

		if (collapseDebounceRef.current) {
			clearTimeout(collapseDebounceRef.current)
			collapseDebounceRef.current = null
		}

		return toggleExpanded(true)
	}, [visible, toggleExpanded])

	const handleMouseLeave = React.useCallback(() => {
		if (!visible || dropdownOpen) {
			return false
		}

		if (collapseDebounceRef.current) {
			clearTimeout(collapseDebounceRef.current)
			collapseDebounceRef.current = null
		}

		// create the timeout
		collapseDebounceRef.current = setTimeout(
			() => toggleExpanded(false),
			window.app.cores.settings.get("sidebar.collapse_delay_time") ?? 500,
		)
	}, [visible, dropdownOpen, toggleExpanded])

	const onDropdownOpenChange = React.useCallback(
		(to) => {
			if (!to && expanded) {
				toggleExpanded(false)
			}

			setDropdownOpen(to)
		},
		[expanded, toggleExpanded],
	)

	const onClickDropdownItem = React.useCallback((item) => {
		const handler = ItemsClickHandlers[item.key]

		if (typeof handler === "function") {
			handler()
		}
	}, [])

	// Initialize
	React.useEffect(() => {
		calculateSelectedMenuItem(app.location.pathname)

		setTimeout(() => {
			toggleVisibility(true)
		}, 10)

		const events = {
			"router.navigate": (path) => {
				calculateSelectedMenuItem(path)
			},
		}

		for (const [event, handler] of Object.entries(events)) {
			app.eventBus.on(event, handler)
		}

		return () => {
			for (const [event, handler] of Object.entries(events)) {
				app.eventBus.off(event, handler)
			}
		}
	}, [])

	return (
		<AnimatePresence propagate>
			{visible && (
				<Sidebar
					expanded={expanded}
					topItems={topItems}
					bottomItems={bottomItems}
					selectedMenuItem={selectedMenuItem}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					onHandleClick={handleClick}
					onDropdownOpenChange={onDropdownOpenChange}
					onClickDropdownItem={onClickDropdownItem}
					dropdownOpen={dropdownOpen}
				/>
			)}
		</AnimatePresence>
	)
}

export default SidebarWrapper
