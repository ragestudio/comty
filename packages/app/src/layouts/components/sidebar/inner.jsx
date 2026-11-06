import React from "react"
import config from "@config"
import { Menu } from "antd"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, usePresence } from "motion/react"
import { useLocation } from "react-router"

import { Icons } from "@components/Icons"
import ProductChannelBadge from "@components/ProductChannelBadge"
import NotificationsButton from "@components/NotificationsButton"

import GroupsList from "@/components/Spaces/GroupList"
import { useSpacesNavigation } from "@/stores/spaces/navigation"
import { GroupListActionItem } from "@components/Spaces/GroupListItem"

import "./index.less"

export function authorizedItems() {
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
			className: "sidebar-profile-button",
			icon: (
				<img
					className="sidebar-profile-button__avatar"
					src={app.userData?.avatar}
				/>
			),
			label: (
				<span className="sidebar-profile-button__label">
					@{app.userData.username}
				</span>
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

	const onClickSpacesHome = () => {
		spacesNav.actions.navigate({
			type: null,
			room: null,
			channel: null,
			subview: null,
		})
	}

	React.useEffect(() => {
		if (
			location.pathname &&
			typeof location.pathname?.startsWith === "function"
		) {
			if (location.pathname?.startsWith("/spaces")) {
				setGroupsListVisible(true)
			} else {
				setGroupsListVisible(false)
			}
		}
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
						<div
							className={classnames("app_sidebar_menu_groups", {
								compact: !expanded,
							})}
						>
							<GroupListActionItem
								id="spaces-home-button"
								title="Home"
								compact={!expanded}
								icon={<Icons.Home />}
								onClick={onClickSpacesHome}
							/>

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
						items={[...bottomItems, ...authorizedItems()]}
						selectedKeys={[selectedKeyId]}
					/>
				</div>
			</div>
		</motion.div>
	)
}

export default SidebarInner
