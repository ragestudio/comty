import type { MenuProps } from "antd"
import type {
	ItemType,
	MenuItemGroupType,
	MenuItemType,
} from "antd/es/menu/interface"
import type { SettingsGroup } from "../../types"

import React from "react"
import * as antd from "antd"
import classNames from "clsx"
import { Translation, useTranslation } from "react-i18next"

import DonativeSelector from "@components/DonativeSelector"
import { createIconRender } from "@components/Icons"

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators"

import { settingsStore } from "../../store"
import extraMenuItems from "./extraMenuItems"
import { menu } from "./styles"

type MenuItems = NonNullable<MenuProps["items"]>

interface MenuGroupDecorator {
	label?: string | null
	icon?: string
}

type SettingsMenuGroupItem = MenuItemGroupType & {
	icon?: React.ReactNode
}

const groupDecorators = menuGroupsDecorators as Record<
	string,
	MenuGroupDecorator
>

const menuEvents: Partial<Record<string, () => void>> = {
	donate: () => {
		app.layout.modal.open("donate", DonativeSelector)
	},
	logout: () => {
		app.auth.logout()
	},
}

function generateMenuItems(groups: SettingsGroup[]): MenuItems {
	const items: SettingsMenuGroupItem[] = groups.map((entry, index) => {
		const children: ItemType[] = entry.children.map(
			(item): MenuItemType => ({
				key: item.id,
				type: "item",
				icon: createIconRender(item.icon ?? "Settings"),
				label: <span>{item.label}</span>,
				danger: item.danger,
				disabled: item.disabled,
			}),
		)

		if (index !== groups.length - 1) {
			children.push({
				type: "divider",
			})
		}

		const decorator = groupDecorators[entry.group]

		return {
			key: entry.group,
			type: "group",
			children,
			icon: decorator?.icon && createIconRender(decorator.icon),
			label: entry.group !== "bottom" && (
				<Translation>
					{(t) => t(decorator?.label ?? entry.group)}
				</Translation>
			),
		}
	})

	const lastGroup = items[items.length - 1]

	if (lastGroup) {
		lastGroup.children = [...(lastGroup.children ?? []), ...extraMenuItems]
	}

	return items
}

export const SettingsMenu = () => {
	const { t } = useTranslation()

	const groups = settingsStore((state) => state.groups)
	const activeKey = settingsStore((state) => state.activeKey)
	const searchQuery = settingsStore((state) => state.searchQuery)
	const navigate = settingsStore((state) => state.actions.navigate)
	const setSearchQuery = settingsStore(
		(state) => state.actions.setSearchQuery,
	)
	const [inputValue, setInputValue] = React.useState("")

	React.useEffect(() => {
		if (!searchQuery) {
			setInputValue("")
		}
	}, [searchQuery])

	React.useEffect(() => {
		if (inputValue === searchQuery) return

		if (!inputValue.trim()) {
			setSearchQuery("")
			return
		}

		const timeout = window.setTimeout(() => {
			React.startTransition(() => {
				setSearchQuery(inputValue)
			})
		}, 250)

		return () => window.clearTimeout(timeout)
	}, [inputValue, searchQuery, setSearchQuery])

	const menuItems = React.useMemo(() => generateMenuItems(groups), [groups])

	console.log(menuItems)

	const handleClick: NonNullable<MenuProps["onClick"]> = (event) => {
		const eventHandler = menuEvents[event.key]

		if (typeof eventHandler === "function") {
			return eventHandler()
		}

		setInputValue("")
		setSearchQuery("")

		app.cores.sfx.play("settings.navigation")

		navigate(event.key)
	}

	return (
		<div className={classNames(menu(), "bg-accent")}>
			<antd.Input
				className={menu.elem("search")}
				value={inputValue}
				placeholder={t("search_settings")}
				prefix={createIconRender("Search")}
				allowClear
				onChange={(event) => setInputValue(event.target.value)}
			/>

			<antd.Menu
				mode="vertical"
				items={menuItems}
				onClick={handleClick}
				selectedKeys={activeKey ? [activeKey] : []}
			/>
		</div>
	)
}

export default SettingsMenu
