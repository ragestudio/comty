import * as antd from "antd"
import Button from "@ui/Button"
import { SliderPicker } from "react-color"
import { SettingItemCtx } from "../../types"

export const SettingsComponents: Record<
	string,
	{ component: any; props?: (ctx: any) => any }
> = {
	button: {
		component: Button,
		props: (itemCtx: any) => {
			return {
				type: "primary",
				onClick: (event: any) => itemCtx.onUpdateItem(event),
			}
		},
	},
	switch: {
		component: antd.Switch,
		props: (itemCtx: any) => {
			return {
				onChange: (event: any) => itemCtx.onUpdateItem(event),
			}
		},
	},
	slider: {
		component: antd.Slider,
		props: (itemCtx: any) => {
			return {
				onChange: (event: any) => itemCtx.onUpdateItem(event),
			}
		},
	},
	input: {
		component: antd.Input,
		props: (itemCtx: any) => {
			return {
				defaultValue: itemCtx.currentValue,
				onChange: (event: any) => itemCtx.onUpdateItem(event.target.value),
				onPressEnter: (event: any) =>
					itemCtx.dispatchUpdate(event.target.value),
			}
		},
	},
	textarea: {
		component: antd.Input.TextArea,
		props: (itemCtx: any) => {
			return {
				defaultValue: itemCtx.currentValue,
				onChange: (event: any) => itemCtx.onUpdateItem(event.target.value),
				onPressEnter: (event: any) =>
					itemCtx.dispatchUpdate(event.target.value),
			}
		},
	},
	inputnumber: {
		component: antd.InputNumber,
	},
	select: {
		component: antd.Select,
		props: (itemCtx: any) => {
			return {
				onChange: (event: any) => itemCtx.onUpdateItem(event),
			}
		},
	},
	slidercolorpicker: {
		component: SliderPicker,
		props: (itemCtx: any) => {
			return {
				onChange: (color: any) => {
					// This one is tricky as it updates local state in the original code
					// We might need to handle it differently in the functional component
					itemCtx.updateCurrentValue(color.hex)
				},
				onChangeComplete: (color: any) => {
					itemCtx.onUpdateItem(color.hex)
				},
				color: itemCtx.currentValue,
			}
		},
	},
}

export default SettingsComponents
