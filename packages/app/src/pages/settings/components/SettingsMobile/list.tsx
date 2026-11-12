import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { createIconRender } from "@components/Icons"

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators"

import SettingTab from "../SettingTab"
import { settingsStore } from "../../store"
import { mobile } from "./styles"

interface SettingsMobileListProps {
	activeKey: string | null
	initialized: boolean
}

const SettingsMobileList: React.FC<SettingsMobileListProps> = ({
	activeKey,
	initialized,
}) => {
	const groups = settingsStore((state) => state.groups)
	const actions = settingsStore((state) => state.actions)

	return (
		<div className={mobile.elem("list")}>
			{initialized &&
				!activeKey &&
				groups.map((entry) => {
					const groupDecorator = (menuGroupsDecorators as any)[entry.group]

					return (
						<div
							className={mobile.elem("group")}
							key={entry.group}
						>
							<span className={mobile.elem("group-title")}>
								<Translation>
									{(t) => t(groupDecorator?.label ?? entry.group)}
								</Translation>
							</span>

							<div className={mobile.elem("group-items")}>
								{entry.children.map((settingsModule) => {
									return (
										<antd.Button
											size="large"
											key={settingsModule.id}
											id={settingsModule.id}
											icon={createIconRender(settingsModule.icon)}
											onClick={() => {
												actions.navigate(settingsModule.id, {
													transition: true,
													scroll: true,
												})
											}}
										>
											<Translation>
												{(t) => t(settingsModule.label)}
											</Translation>
										</antd.Button>
									)
								})}
							</div>
						</div>
					)
				})}

			{initialized && activeKey && (
				<div className={mobile.elem("render")}>
					<SettingTab />
				</div>
			)}
		</div>
	)
}

export default SettingsMobileList
