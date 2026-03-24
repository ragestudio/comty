import React from "react"
import { motion } from "motion/react"
import classNames from "classnames"
import { Icons } from "@components/Icons"

import SettingsTab from "@pages/settings/components/SettingTab"

import "./quickSettings.less"

const QuickSettings = ({ close }) => {
	const onClickGoToSettings = () => {
		if (typeof close === "function") close()
		app.navigation.goToSettings()
	}

	return (
		<div className="vc-quick-settings">
			<div className="vc-quick-settings__header">
				<a onClick={onClickGoToSettings}>
					<Icons.ChevronLeft /> all settings
				</a>

				<div className="divider" />

				<h1>
					<Icons.Settings /> Voice Settings
				</h1>
			</div>

			<div className="vc-quick-settings__content">
				<SettingsTab activeKey="voice" />
			</div>
		</div>
	)
}

export default QuickSettings
