import React from "react"

import Button from "@ui/Button"
import { createIconRender } from "@components/Icons"

import type { Setting, SettingAction } from "../../types"

interface ExtraActionsProps {
	setting: Setting
	ctx: any
	actions?: (SettingAction | React.ComponentType<any> | React.ReactNode)[]
}

const SettingItemExtraActions: React.FC<ExtraActionsProps> = ({
	setting,
	ctx,
	actions,
}) => {
	if (!actions) {
		return null
	}

	return (
		<>
			{actions.map((action: any, index: number) => {
				if (typeof action === "function") {
					return React.createElement(action, {
						key: index,
						ctx,
						setting,
					})
				}

				if (React.isValidElement(action)) {
					return React.cloneElement(action as React.ReactElement, {
						key: index,
					})
				}

				const handleOnClick = () => {
					if (action.onClick) {
						action.onClick(ctx)
					}
				}

				return (
					<Button
						key={action.id || index}
						id={action.id}
						onClick={handleOnClick}
						icon={action.icon && createIconRender(action.icon)}
						type={action.type ?? "default"}
						disabled={setting.disabled}
					>
						{action.title}
					</Button>
				)
			})}
		</>
	)
}

export default SettingItemExtraActions
