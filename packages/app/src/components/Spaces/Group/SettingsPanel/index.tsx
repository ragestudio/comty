import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

import React from "react"
import { Menu } from "antd"
import { useGroupData } from "@comty/spaces-sdk/group"

import settings_imports from "./settings_imports"

export type SettingTab = {
	key: string
	label: string
	icon?: React.ComponentType
	permission?: GroupPermission
	render?: React.ComponentType
}

export const SettingsMenu = ({
	selectedKey,
	setSelectedKey,
	settings,
}: {
	selectedKey: string
	setSelectedKey: (key: string) => void
	settings: SettingTab[]
}) => {
	return (
		<Menu
			className="group-settings-panel__menu"
			mode="vertical"
			selectedKeys={[selectedKey]}
			onSelect={(e) => {
				setSelectedKey(e.key)
			}}
			items={settings.map((setting) => {
				return {
					key: setting.key,
					label: (
						<span>
							{setting.icon && React.createElement(setting.icon)}
							{setting.label ?? setting.key}
						</span>
					),
				}
			})}
		/>
	)
}

export const SettingsRender = ({
	settings,
	selectedKey,
}: {
	settings: SettingTab[]
	selectedKey: string
}) => {
	const render = () => {
		const setting = settings.find((setting) => setting.key === selectedKey)

		if (!setting || !setting?.render) {
			return null
		}

		return React.createElement(setting.render)
	}

	return <div className="group-settings-panel__content">{render()}</div>
}

export const useGroupSettingsPage = () => {
	const data = useGroupData()
	const [selectedKey, setSelectedKey] = React.useState("general")

	const allSettings = React.useMemo(settings_imports, [])
	const permissions = data?.viewer_permissions
	const isOwner =
		data?.is_owner === true ||
		(Boolean(data?.owner_user_id) && data?.owner_user_id === app.userData?._id)

	const settings = React.useMemo(() => {
		if (isOwner) return allSettings

		// fallback to every tab until the viewer permissions are loaded
		if (!permissions) return allSettings

		return allSettings.filter((setting) => {
			if (!setting.permission) return true

			return permissions[setting.permission] === true
		})
	}, [allSettings, permissions, isOwner])

	React.useEffect(() => {
		if (settings.length === 0) return

		if (!settings.some((setting) => setting.key === selectedKey)) {
			setSelectedKey(settings[0].key)
		}
	}, [settings, selectedKey])

	return {
		selectedKey,
		setSelectedKey,
		settings,
	}
}

export const SettingsTab = () => {
	const { selectedKey, setSelectedKey, settings } = useGroupSettingsPage()

	return (
		<div className="group-settings-panel">
			<SettingsMenu
				selectedKey={selectedKey}
				setSelectedKey={setSelectedKey}
				settings={settings}
			/>
			<SettingsRender
				settings={settings}
				selectedKey={selectedKey}
			/>
		</div>
	)
}

export default SettingsTab
