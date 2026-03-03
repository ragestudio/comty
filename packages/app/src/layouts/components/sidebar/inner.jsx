import React from "react"
import config from "@config"
import classnames from "classnames"
import { Translation } from "react-i18next"
import { motion, usePresence } from "motion/react"
import { Menu, Avatar, Dropdown } from "antd"

import { Icons } from "@components/Icons"
import ProductChannelBadge from "@components/ProductChannelBadge"
import NotificationsButton from "@components/NotificationsButton"

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
			icon: <Icons.FiLogIn />,
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

export default SidebarInner
