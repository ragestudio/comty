import React from "react"
import { Icons } from "components/icons"
import { SliderPicker } from "react-color"
import * as antd from "antd"
import config from "config"

import settingList from "schemas/settingsList.json"
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
		settings: window.app.configuration.settings.get() ?? {},
	}

	handleEvent = (event, item, to) => {
		const id = item.id

		if (typeof id === "undefined") {
			console.error("SettingsMenu: Cannot update, item has no id")
			return false
		}

		const currentValue = window.app.configuration.settings.get(id) ?? null

		// by default we set the opposite value to the current value
		if (typeof to === "undefined") {
			to = !currentValue
		}

		if (typeof item.updateValueKey === "string") {
			to = { [item.updateValueKey]: to }
		}

		if (typeof item.emitEvent === "string") {
			window.app.eventBus.emit(item.emitEvent, { event, to })
		}

		if (!item.noStorage) {
			window.app.configuration.settings.change(id, to)
		}

		this.setState({ settings: { ...this.state.settings, [id]: to } })
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
				item.props.onChangeComplete = (color, event) => {
					this.handleEvent(event, item, color.hex)
				}
				break
			}
			case "switch": {
				item.props.checked = this.state.settings[item.id]
				item.props.onClick = (event) => this.handleEvent(event, item)
				break
			}
			default: {
				if (!item.props.children) {
					item.props.children = item.title ?? item.id
				}
				item.props.value = this.state.settings[item.id]
				item.props.onClick = (event) => this.handleEvent(event, item)
				break
			}
		}

		return (
			<div key={item.id} className="settingItem">
				<div className="header">
					<div>
						<h5>
							{item.icon ? React.createElement(Icons[item.icon]) : null}
							{item.title ?? item.id}
						</h5>
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
					{fromDecoratorTitle ?? key}
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
		const isDevMode = window.__evite.env.NODE_ENV !== "production"

		return (
			<div className="settings">
				{this.generateSettings(settingList)}
				<div className="footer">
					<div>
						<div>{config.app?.siteName}</div>
						<div>
							<antd.Tag>
								<Icons.Tag />v{window.__evite.projectVersion}
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
							About
						</antd.Button>
					</div>
				</div>
			</div>
		)
	}
}