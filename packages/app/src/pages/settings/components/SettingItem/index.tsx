import type { Setting } from "../../types"

import React from "react"
import * as antd from "antd"

import Button from "@ui/Button"
import { Icons } from "@components/Icons"

import SettingItemHeader from "./header"
import SettingsComponents from "./components"
import { item } from "./styles"
import { useSetting } from "../../hooks/useSetting"

interface SettingItemProps {
	setting: Setting
	ctx: any
	onUpdate?: (value: any) => void
}

function shouldUseHorizontalLayout(type: string) {
	switch (type) {
		case "switch":
			return true
		case "button":
			return true
		default:
			return false
	}
}

const SettingItem: React.FC<SettingItemProps> = ({
	setting,
	ctx,
	onUpdate,
}) => {
	const {
		value,
		debouncedValue,
		loading,
		disabled,
		componentProps,
		itemCtx,
		componentRef,
		dispatchUpdate,
	} = useSetting(setting, ctx, onUpdate)

	if (!setting) {
		console.error(`Item has no an setting!`)
		return null
	}

	if (!setting.component && !setting.render) {
		console.error(`Item [${setting.id}] has no an setting component or render!`)
		return null
	}

	const componentType =
		typeof setting.component === "string" ? setting.component.toLowerCase() : ""

	const generateInhertedProps = () => {
		if (!SettingsComponents[componentType]) {
			return {}
		}

		if (typeof SettingsComponents[componentType].props === "function") {
			return SettingsComponents[componentType].props!(itemCtx)
		}

		return {}
	}

	const finalProps = {
		...componentProps,
		...generateInhertedProps(),
		...setting.props,
		ctx: itemCtx,
		ref: componentRef,
		checked: value,
		value: value,
		disabled: disabled || setting.disabled,
		size: app.isMobile ? "large" : "default",
	}

	if (setting.children) {
		finalProps.children = setting.children
	}

	const Component =
		typeof setting.component === "string"
			? (SettingsComponents[componentType]?.component ?? setting.component)
			: setting.component

	const horizontal =
		setting.layout === "horizontal" ||
		(setting.layout !== "vertical" && shouldUseHorizontalLayout(componentType))

	if (setting.render) {
		return React.createElement(setting.render, finalProps)
	}

	return (
		<div
			id={setting.id}
			className={item({
				horizontal,
				padding: setting.usePadding ?? true,
				mobile: app.isMobile,
			})}
		>
			<SettingItemHeader
				setting={setting}
				itemCtx={itemCtx}
			/>

			<div className={item.elem("content")}>
				<>
					{!loading && React.createElement(Component, finalProps)}
					{loading && <antd.Spin />}
					{debouncedValue && (
						<Button
							type="round"
							icon={<Icons.Check />}
							onClick={async () => await dispatchUpdate(debouncedValue)}
						>
							Save
						</Button>
					)}
				</>
			</div>
		</div>
	)
}

export default React.memo(SettingItem)
