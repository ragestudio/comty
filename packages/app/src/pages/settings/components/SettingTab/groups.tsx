import React from "react"
import { Translation } from "react-i18next"

import { Icons } from "@components/Icons"

import groupsDecorators from "@config/settingsGroupsDecorators"

import LazyMount from "../LazyMount"
import SettingItem from "../SettingItem"
import {
	SettingsGroup,
	SettingsGroupHeader,
	SettingsLazySetting,
	SettingsList,
} from "../../layout"
import type { Setting } from "../../types"

interface SettingTabGroupsProps {
	groups: [string, Setting[]][]
	ctx: any
	search?: boolean
	onUpdate?: (key: string, value: any) => void
}

const SettingTabGroups: React.FC<SettingTabGroupsProps> = ({
	groups,
	ctx,
	search,
	onUpdate,
}) => {
	return (
		<>
			{groups.map(([groupKey, settings]) => {
				const decorator = (groupsDecorators as any)[groupKey]
				const fromDecoratorIcon = decorator?.icon
				const fromDecoratorTitle = decorator?.title

				return (
					<SettingsGroup
						key={groupKey}
						id={search ? undefined : groupKey}
					>
						{fromDecoratorTitle !== null && fromDecoratorIcon && (
							<SettingsGroupHeader>
								<h1>
									{React.createElement(
										(Icons as any)[fromDecoratorIcon],
									)}

									{fromDecoratorTitle !== null && (
										<Translation>
											{(t) =>
												t(fromDecoratorTitle ?? groupKey)
											}
										</Translation>
									)}
								</h1>
							</SettingsGroupHeader>
						)}

						<SettingsList>
							{settings.map((setting, index) => {
								const content = (
									<SettingItem
										key={index}
										setting={setting}
										ctx={ctx}
										onUpdate={(value) =>
											onUpdate?.(setting.id, value)
										}
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
						</SettingsList>
					</SettingsGroup>
				)
			})}
		</>
	)
}

export default SettingTabGroups
