import React from "react"

import SettingsMobileHeader from "./components/SettingsMobile/header"
import SettingsMobileList from "./components/SettingsMobile/list"
import { mobile } from "./components/SettingsMobile/styles"
import { useSettingsNavigation } from "./store"

const SettingsMobilePage = () => {
	const { activeKey, initialized, actions } = useSettingsNavigation(null)

	const back = () => {
		actions.back({
			transition: true,
			scroll: true,
		})
	}

	return (
		<div className={mobile()}>
			<SettingsMobileHeader
				activeKey={initialized ? activeKey : null}
				back={back}
			/>

			<SettingsMobileList
				activeKey={activeKey}
				initialized={initialized}
			/>
		</div>
	)
}

export default SettingsMobilePage
