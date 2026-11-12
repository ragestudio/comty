import type { MenuItemType } from "antd/es/menu/interface"

import { createIconRender } from "@components/Icons"

import { menu } from "./styles"

export const extraMenuItems: MenuItemType[] = [
	{
		key: "donate",
		label: (
			<div className={menu.elem("extra-item", "support")}>
				{createIconRender("HandCoins")}
				<span>Support us</span>
			</div>
		),
	},
	{
		key: "logout",
		label: (
			<div className={menu.elem("extra-item")}>
				{createIconRender("Logout")}
				<span>Logout</span>
			</div>
		),
		danger: true,
	},
]

export default extraMenuItems
