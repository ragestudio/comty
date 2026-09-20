import React from "react"
import { Menu } from "antd"

import settings_imports from "./settings_imports"

import "./index.less"

export type SettingTab = {
	key: string
	label: string
	icon?: React.ComponentType
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
	const [selectedKey, setSelectedKey] = React.useState("general")
	const settings = React.useMemo(settings_imports, [])

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
