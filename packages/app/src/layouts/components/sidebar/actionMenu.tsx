import type { ItemType, MenuItemType } from "antd/es/menu/interface"

import { Menu } from "antd"
import { Translation } from "react-i18next"
import Icons from "@/components/Icons"

import { openModal as openSettingsModal } from "@/pages/settings"

import "./actionMenu.less"

export type actionMenuItem = ItemType<MenuItemType> & {
	key?: string
	preventAutoClose?: boolean
}

export type actionMenuItemTrigger = {
	item: actionMenuItem
	control?: Record<string, Function>
	closeHook?: () => void
}

export const onActionMenuItemClick = async (trigger: actionMenuItemTrigger) => {
	try {
		if (!trigger.item.key) return

		const handler = actionMenuHandlers[trigger.item.key]

		if (!handler) {
			console.error("Unhandled action menu item")
			return
		}

		return await handler(trigger)
	} finally {
		if (!trigger.item.preventAutoClose) {
			if (typeof trigger.closeHook === "function") {
				trigger.closeHook()
			}
		}
	}
}

export const actionMenuItems = [
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
] satisfies actionMenuItem[]

export const actionMenuHandlers = {
	settings: () => {
		openSettingsModal()
	},
	profile: () => {
		window.app.navigation.goToAccount()
	},
	studio: () => {
		window.app.location.push("/studio")
	},
	login: () => {
		window.app.navigation.goAuth()
	},
	logout: () => {
		app.auth.logout()
	},
} satisfies Record<string, (trigger: actionMenuItemTrigger) => any>

export const ActionMenu = (props) => {
	return (
		<Menu
			className="app_sidebar_action-menu"
			classNames={{
				item: "app_sidebar_action-menu__item",
			}}
			style={props.style}
			items={actionMenuItems}
			selectedKeys={[]}
			selectable={false}
			onClick={(_props) =>
				onActionMenuItemClick({
					...props,
					item: _props.itemData,
				})
			}
		/>
	)
}

export default actionMenuItems
