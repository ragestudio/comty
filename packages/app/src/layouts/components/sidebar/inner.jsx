import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, usePresence } from "motion/react"
import { Menu, Avatar, Dropdown } from "antd"
import { useLocation } from "react-router"

import { Icons } from "@components/Icons"
import ProductChannelBadge from "@components/ProductChannelBadge"
import NotificationsButton from "@components/NotificationsButton"

import GroupsList from "@/components/Spaces/GroupList"
import { useSpacesNavigation } from "@/stores/spaces/navigation"

import "./index.less"

/** @type {any[]} */
const ActionMenuItems = [
	{
		key: "profile",
		label: (
			<>
				<Icons.User />
				<Translation>{(t) => t("Profile")}</Translation>
			</>
		),
	},
	{
		key: "studio",
		label: (
			<>
				<Icons.CircleFadingPlusIcon />
				<Translation>{(t) => t("Studio")}</Translation>
			</>
		),
	},
	{
		key: "addons",
		label: (
			<>
				<Icons.Box />
				<Translation>{(t) => t("Addons")}</Translation>
			</>
		),
	},
	{
		key: "settings",
		label: (
			<>
				<Icons.Settings />
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
				<Icons.SquareArrowRightEnter />
				<Translation>{(t) => t("Switch account")}</Translation>
			</>
		),
	},
	{
		key: "logout",
		label: (
			<>
				<Icons.LogOut />
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
			key: "notifications",
			//ignore_click: "true",
			icon: <NotificationsButton />,
			label: "Notifications",
		})

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
			icon: <Icons.LogIn />,
		})
	}

	return items
}

const SidebarInner = ({
	expanded,
	topItems,
	bottomItems,
	selectedMenuItem,
	onMouseEnter,
	onMouseLeave,
	onHandleClick,
	onDropdownOpenChange,
	onClickDropdownItem,
}) => {
	const location = useLocation()
	const spacesNav = useSpacesNavigation()

	const [isPresent] = usePresence()
	const [hidden, setHidden] = React.useState(false)
	const [groupsListVisible, setGroupsListVisible] = React.useState(false)
	const sidebarRef = React.useRef(null)
	const autoHideDefaultItemsTimeout = React.useRef(null)

	const selectedKeyId = selectedMenuItem?.id

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

	const handleOnClickGroupListItem = (group) => {
		app.location.push(`/spaces/group/${group._id}`)
	}

	const handleOnClickCreateNewGroup = () => {
		app.location.push(`/spaces/new`)
	}

	const onClickHomeButton = () => {
		if (autoHideDefaultItemsTimeout.current) {
			clearTimeout(autoHideDefaultItemsTimeout.current)
		}

		autoHideDefaultItemsTimeout.current = setTimeout(() => {
			if (app.location.pathname?.startsWith("/spaces")) {
				setGroupsListVisible(true)
			}
		}, 4000)

		if (!groupsListVisible) {
			app.navigation.goMain()
			clearTimeout(autoHideDefaultItemsTimeout.current)
		} else {
			setGroupsListVisible(false)
		}
	}

	React.useEffect(() => {
		if (
			location.pathname &&
			typeof location.pathname?.startsWith === "function"
		) {
			if (location.pathname?.startsWith("/spaces")) {
				setGroupsListVisible(true)
				spacesNav.actions.initFromUrl()
			} else {
				setGroupsListVisible(false)
			}
		}

		// return () =>
		// 	window.removeEventListener(
		// 		"popstate",
		// 		spacesNav.actions.initFromUrl,
		// 	)
	}, [location])

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
							onClick={onClickHomeButton}
						/>

						<ProductChannelBadge />
					</div>
				</div>

				<div
					key="menu"
					className="app_sidebar_menu_wrapper"
				>
					{groupsListVisible && (
						<div className="app_sidebar_menu_groups">
							<GroupsList
								compact={!expanded}
								selected={
									spacesNav.type === "group"
										? spacesNav.room
										: null
								}
								onClickItem={handleOnClickGroupListItem}
								onClickCreateNew={handleOnClickCreateNewGroup}
								sortable
							/>
						</div>
					)}
					{!groupsListVisible && (
						<Menu
							mode="inline"
							onClick={onHandleClick}
							selectedKeys={[selectedKeyId]}
							items={topItems}
						/>
					)}
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

export default SidebarInner
