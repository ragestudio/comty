import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import DonativeSelector from "@components/DonativeSelector"
import PageTransition from "@components/PageTransition"
import { createIconRender } from "@components/Icons"

import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"
import useUserRemoteConfig from "@hooks/useUserRemoteConfig"

import { composedSettingsByGroups as settings } from "@/settings"

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators"

import SettingTab from "./components/SettingTab"

import "./index.less"

const extraMenuItems = [
	{
		key: "donate",
		label: (
			<div
				style={{
					color: "#f72585",
				}}
			>
				{createIconRender("FiHeart")}
				Support us
			</div>
		),
	},
	{
		key: "logout",
		label: (
			<div>
				{createIconRender("MdOutlineLogout")}
				Logout
			</div>
		),
		danger: true,
	},
]

const menuEvents = {
	donate: () => {
		app.layout.modal.open("donate", DonativeSelector)
	},
	logout: () => {
		app.auth.logout()
	},
}

const generateMenuItems = () => {
	return settings.map((entry, index) => {
		const children = entry.groupModule.map((item) => {
			return {
				key: item.id,
				type: "item",
				label: (
					<div {...item.props} className="menu-item-content">
						{createIconRender(item.icon ?? "Settings")}
						{item.label}
					</div>
				),
				danger: item.danger,
				disabled: item.disabled,
			}
		})

		if (index !== settings.length - 1) {
			children.push({
				type: "divider",
			})
		}

		return {
			key: entry.group,
			type: "group",
			children: children,
			label:
				entry.group === "bottom" ? null : (
					<>
						{menuGroupsDecorators[entry.group]?.icon &&
							createIconRender(
								menuGroupsDecorators[groupKey]?.icon ??
									"Settings",
							)}
						<Translation>
							{(t) =>
								t(
									menuGroupsDecorators[entry.group]?.label ??
										entry.group,
								)
							}
						</Translation>
					</>
				),
		}
	})
}

export default () => {
	const [config, setConfig, loading] = useUserRemoteConfig()
	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		defaultKey: "general",
		queryKey: "tab",
	})

	const onChangeTab = (event) => {
		if (typeof menuEvents[event.key] === "function") {
			return menuEvents[event.key]()
		}

		app.cores.sfx.play("settings.navigation")

		setActiveKey(event.key)
	}

	const menuItems = React.useMemo(() => {
		const items = generateMenuItems()

		extraMenuItems.forEach((item) => {
			items[settings.length - 1].children.push(item)
		})

		return items
	}, [])

	function handleOnUpdate(key, value) {
		setConfig({
			...config,
			[key]: value,
		})
	}

	React.useEffect(() => {
		if (app.layout.tools_bar) {
			app.layout.tools_bar.toggleVisibility(false)
		}
	}, [activeKey])

	React.useEffect(() => {
		return () => {
			if (app.layout.tools_bar) {
				app.layout.tools_bar.toggleVisibility(true)
			}
		}
	}, [])

	return (
		<div className="settings_wrapper">
			<div className="settings_menu">
				<antd.Menu
					mode="vertical"
					items={menuItems}
					onClick={onChangeTab}
					selectedKeys={[activeKey]}
				/>
			</div>

			{loading && <antd.Skeleton active />}

			<PageTransition className="settings_content" key={activeKey}>
				{!loading && (
					<SettingTab
						baseConfig={config}
						onUpdate={handleOnUpdate}
						activeKey={activeKey}
						withGroups
					/>
				)}
			</PageTransition>
		</div>
	)
}
