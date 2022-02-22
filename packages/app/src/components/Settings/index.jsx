import React from "react"
import * as antd from "antd"
import { SliderPicker } from "react-color"
import { Translation } from "react-i18next"

import config from "config"
import { Icons } from "components/Icons"
import settingList from "schemas/settings"
import groupsDecorator from "schemas/settingsGroupsDecorator.json"

import { AboutApp } from ".."

import "./index.less"

const ItemTypes = {
	Button: antd.Button,
	Switch: antd.Switch,
	Slider: antd.Slider,
	Checkbox: antd.Checkbox,
	Input: antd.Input,
	InputNumber: antd.InputNumber,
	Select: antd.Select,
	SliderColorPicker: SliderPicker,
}

export default class SettingsMenu extends React.Component {
	state = {
		settings: window.app.settings.get() ?? {},
	}

	handleUpdate = (item, update) => {
		if (typeof item.id === "undefined") {
			console.error("[Settings] Cannot handle update, item has no id")
			return false
		}

		const currentValue = window.app.settings.get(item.id)

		if (typeof update === "undefined") {
			update = !currentValue
		}

		if (typeof item.emitEvent === "string") {
			let emissionPayload = update

			if (typeof item.emissionValueUpdate === "function") {
				emissionPayload = item.emissionValueUpdate(emissionPayload)
			}

			window.app.eventBus.emit(item.emitEvent, emissionPayload)
		}

		if (!item.noStorage) {
			window.app.settings.set(item.id, update)
		}

		this.setState({ settings: { ...this.state.settings, [item.id]: update } })
	}

	renderItem = (item) => {
		if (!item.type) {
			console.error(`Item [${item.id}] has no an type!`)
			return null
		}
		if (typeof ItemTypes[item.type] === "undefined") {
			console.error(`Item [${item.id}] has an invalid type: ${item.type}`)
			return null
		}

		if (typeof item.props === "undefined") {
			item.props = {}
		}

		// fix handlers
		switch (item.type.toLowerCase()) {
			case "slidercolorpicker": {
				item.props.onChange = (color) => {
					item.props.color = color.hex
				}
				item.props.onChangeComplete = (color) => {
					this.handleUpdate(item, color.hex)
				}
				break
			}
			case "switch": {
				item.props.checked = this.state.settings[item.id]
				item.props.onClick = (event) => this.handleUpdate(item, event)
				break
			}
			case "select": {
				item.props.onChange = (value) => this.handleUpdate(item, value)
				item.props.defaultValue = this.state.settings[item.id]
				break
			}
			case "slider":{
				item.props.defaultValue = this.state.settings[item.id]
				item.props.onAfterChange = (value) => this.handleUpdate(item, value)
				break
			}
			default: {
				if (!item.props.children) {
					item.props.children = item.title ?? item.id
				}
				item.props.value = this.state.settings[item.id]
				item.props.onClick = (event) => this.handleUpdate(item, event)
				break
			}
		}

		// TODO: Support async children
		// if (typeof item.children === "function") {

		// }

		return (
			<div key={item.id} className="settingItem">
				<div className="header">
					<div>
						<h4>
							{Icons[item.icon] ? React.createElement(Icons[item.icon]) : null}
							<Translation>{
								t => t(item.title ?? item.id)
							}</Translation>
						</h4>
						<p>	<Translation>{
							t => t(item.description)
						}</Translation></p>
					</div>
					<div>
						{item.experimental && <antd.Tag> Experimental </antd.Tag>}
					</div>
				</div>
				<div className="component">
					{React.createElement(ItemTypes[item.type], item.props)}
				</div>
			</div>
		)
	}

	renderGroup = (key, group) => {
		const fromDecoratorIcon = groupsDecorator[key]?.icon
		const fromDecoratorTitle = groupsDecorator[key]?.title

		return (
			<div key={key} className="group">
				<h1>
					{fromDecoratorIcon ? React.createElement(Icons[fromDecoratorIcon]) : null}
					<Translation>{
						t => t(fromDecoratorTitle ?? key)
					}</Translation>
				</h1>
				<div className="content">
					{group.map((item) => this.renderItem(item))}
				</div>
			</div>
		)
	}

	generateSettings = (data) => {
		let groups = {}

		data.forEach((item) => {
			if (!groups[item.group]) {
				groups[item.group] = []
			}

			groups[item.group].push(item)
		})

		return Object.keys(groups).map((groupKey) => {
			return this.renderGroup(groupKey, groups[groupKey])
		})
	}

	render() {
		const isDevMode = window.__evite?.env?.NODE_ENV !== "production"

		return (
			<div className="settings">
				{this.generateSettings(settingList)}
				<div className="footer">
					<div>
						<div>{config.app?.siteName}</div>
						<div>
							<antd.Tag>
								<Icons.Tag />v{window.app.version}
							</antd.Tag>
						</div>
						<div>
							<antd.Tag color={isDevMode ? "magenta" : "green"}>
								{isDevMode ? <Icons.Triangle /> : <Icons.Box />}
								{isDevMode ? "development" : "stable"}
							</antd.Tag>
						</div>
					</div>
					<div>
						<antd.Button type="link" onClick={() => AboutApp.openModal()}>
							<Translation>
								{t => t("about")}
							</Translation>
						</antd.Button>
					</div>
				</div>
			</div>
		)
	}
}