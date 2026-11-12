import React from "react"
import { Translation } from "react-i18next"

import { createIconRender } from "@components/Icons"

import { SettingsSearchHeader } from "../../layout"
import type { SettingTabModule } from "../../types"

interface SettingTabHeaderProps {
	tab: SettingTabModule
}

const SettingTabHeader: React.FC<SettingTabHeaderProps> = ({ tab }) => {
	return (
		<SettingsSearchHeader>
			{createIconRender(tab.icon ?? "Settings")}

			<h1>
				<Translation>{(t) => t(tab.label)}</Translation>
			</h1>
		</SettingsSearchHeader>
	)
}

export default SettingTabHeader
