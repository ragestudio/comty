import React from "react"
import { Menu } from "antd"

import order from "../../settings/order.js"

import "./index.less"

const SettingsTab = () => {
	const [selectedKey, setSelectedKey] = React.useState("general")

	const settings = React.useMemo(() => {
		let mods = import.meta.glob(["../../settings/*/*.jsx"], { eager: true })

		mods = Object.values(mods).map((mod) => mod.default)

		// sort mods by order(array)
		mods = mods.sort((a, b) => {
			const aOrder = order.findIndex((key) => key === a.key)
			const bOrder = order.findIndex((key) => key === b.key)

			if (aOrder === bOrder) {
				return 0
			}

			return aOrder > bOrder ? 1 : -1
		})

		return mods
	}, [])

	const settingRender = () => {
		const setting = settings.find((setting) => setting.key === selectedKey)

		if (!setting || !setting?.render) {
			return null
		}

		return React.createElement(setting.render)
	}

	console.log("settings", settings)

	return (
		<div className="group-settings-panel">
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
								{setting.icon &&
									React.createElement(setting.icon)}
								{setting.label ?? setting.key}
							</span>
						),
					}
				})}
			/>

			<div className="group-settings-panel__content">
				{settingRender()}
			</div>
		</div>
	)
}

export default SettingsTab
