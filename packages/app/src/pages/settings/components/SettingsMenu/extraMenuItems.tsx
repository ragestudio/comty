import type { MenuItemType } from "antd/es/menu/interface"

import { createIconRender } from "@components/Icons"

export const extraMenuItems: MenuItemType[] = [
	{
		key: "donate",
		icon: createIconRender("HandCoins"),
		label: "Support us",
		style: {
			color: "#f72585",
		},
	},
	{
		key: "logout",
		icon: createIconRender("LogOut"),
		label: "Logout",
		danger: true,
	},
]

export default extraMenuItems
