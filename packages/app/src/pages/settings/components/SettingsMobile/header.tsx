import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons, createIconRender } from "@components/Icons"

import UseTopBar from "@hooks/useTopBar"

import { settingsStore } from "../../store"
import { mobile } from "./styles"

interface SettingsMobileHeaderProps {
	activeKey: string | null
	back?: () => void
}

const SettingsMobileHeader: React.FC<SettingsMobileHeaderProps> = ({
	activeKey,
	back = () => {},
}) => {
	const tabs = settingsStore((state) => state.tabs)
	const currentTab = activeKey ? tabs[activeKey] : null

	return (
		<UseTopBar
			options={{
				className: mobile.elem("header"),
			}}
		>
			{activeKey && (
				<antd.Button
					icon={<Icons.ChevronLeft />}
					onClick={back}
					size="large"
					ghost
				/>
			)}

			<h1>
				{createIconRender(currentTab?.icon ?? "Settings")}
				<Translation>
					{(t) => t(currentTab?.label ?? activeKey ?? "Settings")}
				</Translation>
			</h1>
		</UseTopBar>
	)
}

export default SettingsMobileHeader
