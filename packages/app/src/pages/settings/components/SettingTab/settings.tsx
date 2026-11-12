import React from "react"

import LazyMount from "../LazyMount"
import SettingItem from "../SettingItem"
import { SettingsLazySetting } from "../../layout"
import type { Setting } from "../../types"

interface SettingTabSettingsProps {
	settings: Setting[]
	ctx: any
	search?: boolean
	onUpdate?: (key: string, value: any) => void
}

const SettingTabSettings: React.FC<SettingTabSettingsProps> = ({
	settings,
	ctx,
	search,
	onUpdate,
}) => {
	return (
		<>
			{settings.map((setting, index) => {
				const content = (
					<SettingItem
						key={index}
						setting={setting}
						ctx={ctx}
						onUpdate={(value) => onUpdate?.(setting.id, value)}
					/>
				)

				if (!search) return content

				return (
					<LazyMount
						key={setting.id}
						placeholder={<SettingsLazySetting />}
					>
						{content}
					</LazyMount>
				)
			})}
		</>
	)
}

export default SettingTabSettings
