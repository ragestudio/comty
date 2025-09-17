import * as antd from "antd"
import { SliderPicker } from "react-color"

export const SettingsComponents = {
	button: {
		component: antd.Button,
		props: (_this) => {
			return {
				onClick: (event) => _this.onUpdateItem(event),
			}
		},
	},
	switch: {
		component: antd.Switch,
		props: (_this) => {
			return {
				onChange: (event) => _this.onUpdateItem(event),
			}
		},
	},
	slider: {
		component: antd.Slider,
		props: (_this) => {
			return {
				onChange: (event) => _this.onUpdateItem(event),
			}
		},
	},
	input: {
		component: antd.Input,
		props: (_this) => {
			return {
				defaultValue: _this.state.value,
				onChange: (event) => _this.onUpdateItem(event.target.value),
				onPressEnter: (event) =>
					_this.dispatchUpdate(event.target.value),
			}
		},
	},
	textarea: {
		component: antd.Input.TextArea,
		props: (_this) => {
			return {
				defaultValue: _this.state.value,
				onChange: (event) => _this.onUpdateItem(event.target.value),
				onPressEnter: (event) =>
					_this.dispatchUpdate(event.target.value),
			}
		},
	},
	inputnumber: {
		component: antd.InputNumber,
	},
	select: {
		component: antd.Select,
		props: (_this) => {
			return {
				onChange: (event) => {
					console.log(event)
					_this.onUpdateItem(event)
				},
			}
		},
	},
	slidercolorpicker: {
		component: SliderPicker,
		props: (_this) => {
			return {
				onChange: (color) => {
					_this.setState({
						componentProps: {
							..._this.state.componentProps,
							color,
						},
					})
				},
				onChangeComplete: (color) => {
					_this.onUpdateItem(color.hex)
				},
				color: _this.state.value,
			}
		},
	},
}

export default SettingsComponents
