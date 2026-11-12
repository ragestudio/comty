import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import PageTransition from "@components/PageTransition"

import useUserRemoteConfig from "@hooks/useUserRemoteConfig"

import LazyMount from "./components/LazyMount"
import SettingTab from "./components/SettingTab"
import SettingsMenu from "./components/SettingsMenu"
import { useSettingsSearch } from "./hooks/useSettingsSearch"
import { SettingsRoot, SettingsSearchSectionPlaceholder, b } from "./layout"
import { useSettingsNavigation } from "./store"

const SettingsPage = ({ defaultTabId }: { defaultTabId?: string }) => {
	const [config, setConfig, loading] = useUserRemoteConfig() as [
		any,
		(config: any) => void,
		boolean,
	]
	const { activeKey, initialized } = useSettingsNavigation(
		defaultTabId ?? "general",
	)
	const { searchQuery, searching, searchTabs } = useSettingsSearch()

	function handleOnUpdate(key: string, value: any) {
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
		<SettingsRoot>
			<SettingsMenu />

			{loading && <antd.Skeleton active />}

			<PageTransition
				className={b()}
				key={
					searching
						? "settings-search"
						: initialized
							? (activeKey ?? "settings")
							: (defaultTabId ?? "general")
				}
			>
				{!loading &&
					initialized &&
					(searching ? (
						searchTabs.length ? (
							searchTabs.map((tab) => (
								<LazyMount
									key={tab.id}
									className={b.elem("search-section")}
									placeholder={<SettingsSearchSectionPlaceholder />}
								>
									<SettingTab
										tabId={tab.id}
										search
										showTabHeader
										query={searchQuery}
										baseConfig={config}
										onUpdate={handleOnUpdate}
										withGroups
									/>
								</LazyMount>
							))
						) : (
							<antd.Empty
								image={antd.Empty.PRESENTED_IMAGE_SIMPLE}
								description={
									<Translation>{(t) => t("no_settings_found")}</Translation>
								}
							/>
						)
					) : (
						<SettingTab
							baseConfig={config}
							onUpdate={handleOnUpdate}
							withGroups
						/>
					))}
			</PageTransition>
		</SettingsRoot>
	)
}

SettingsPage.options = {
	layout: {
		maxHeight: true,
	},
}

export const openModal = (tabId?: string) => {
	app.layout.modal.open("settings", SettingsPage, {
		props: {
			wrapperClassname: "app_modal_settings_wrapper",
			contentClassname: "app_modal_settings",
			defaultTabId: tabId,
		},
	})
}

export default SettingsPage
