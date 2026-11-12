import type { Setting, SettingItemCtx } from "../../types"

import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { createIconRender } from "@components/Icons"

import SettingItemExtraActions from "./actions"
import { item } from "./styles"

interface SettingItemHeaderProps {
	setting: Setting
	itemCtx: SettingItemCtx
}

const computeSwitchEnablerDefault = (setting: Setting) => {
	if (typeof setting.switchDefault === "function") {
		return setting.switchDefault()
	}

	return setting.switchDefault
}

const SettingItemHeader: React.FC<SettingItemHeaderProps> = ({
	setting,
	itemCtx,
}) => {
	return (
		<div className={item.elem("header")}>
			<div className={item.elem("info")}>
				<div className={item.elem("title")}>
					<h1>
						{createIconRender(setting.icon)}

						{setting.title && (
							<Translation>{(t) => t(setting.title ?? setting.id)}</Translation>
						)}
					</h1>

					{setting.experimental && <antd.Tag>Experimental</antd.Tag>}
				</div>

				{setting.description && (
					<div className={item.elem("description")}>
						<p>
							<Translation>{(t) => t(setting.description!)}</Translation>
						</p>
					</div>
				)}
			</div>

			<div className={item.elem("actions")}>
				<SettingItemExtraActions
					setting={setting}
					actions={setting.extraActions}
					ctx={itemCtx}
				/>

				{typeof setting.onEnabledChange === "function" && (
					<antd.Switch
						defaultChecked={computeSwitchEnablerDefault(setting)}
						onChange={setting.onEnabledChange}
					/>
				)}
			</div>
		</div>
	)
}

export default SettingItemHeader
