import React from "react"
import { Icons } from "components/Icons"
import * as antd from "antd"
import { SketchPicker } from "react-color"
import { AboutApp } from ".."
import config from "config"

import "./index.less"

const ItemTypes = {
	Button: antd.Button,
	Switch: antd.Switch,
	Slider: antd.Slider,
	Checkbox: antd.Checkbox,
	Input: antd.Input,
	InputNumber: antd.InputNumber,
	Select: antd.Select,
	ColorPicker: SketchPicker,
}

import settingList from "schemas/settings.json"
import groupsDecorator from "schemas/settingsGroups.json"
import { Session } from "models"

export class SettingsMenu extends React.Component {
	state = {
		settings: window.app.configuration.settings.get() ?? {},
	}

	_set(key, value) {
		this.setState({ settings: window.app.configuration.settings.change(key, value) })
	}

	handleEvent(event, id, type) {
		if (typeof id === "undefined") {
			console.error(`No setting id provided!`)
			return false
		}
		if (typeof type !== "string") {
			console.error(`Invalid eventType data-type, expecting string!`)
			return false
		}

		const value = window.app.configuration.settings.get(id) ?? false
		let to = !value

		switch (type.toLowerCase()) {
			case "button": {
				window.app.configuration.settings.events.emit("changeSetting", { event, id, value, to })
				break
			}
			default: {
				this._set(id, to)
				break
			}
		}
	}

	generateMenu(data) {
		let items = {}

		const renderGroupItems = (group) => {
			return items[group].map((item) => {
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
					case "colorpicker": {
						item.props.onChange = (value) => {
							item.props.color = value.hex
						}
						item.props.onChangeComplete = (color, event) => {
							window.app.configuration.settings.events.emit("changeSetting", { id: item.id, event, value: color })
							this._set(item.id, color.hex)
						}
						break
					}
					case "switch": {
						item.props.children = item.title ?? item.id
						item.props.checked = this.state.settings[item.id]
						item.props.onClick = (e) => this.handleEvent(e, item.id ?? "anon", item.type)
						break
					}

					default: {
						item.props.children = item.title ?? item.id
						item.props.value = this.state.settings[item.id]
						item.props.onClick = (e) => this.handleEvent(e, item.id ?? "anon", item.type)
						break
					}
				}

				return (
					<div key={item.id}>
						<h5>
							{item.icon ? React.createElement(Icons[item.icon]) : null}
							{item.title ?? item.id}
						</h5>
						{item.render ??
							React.createElement(ItemTypes[item.type], {
								...item.props,
							})}
					</div>
				)
			})
		}

		const renderGroupDecorator = (group) => {
			if (group === "none") {
				return null
			}
			const fromDecoratorIcon = groupsDecorator[group]?.icon
			const fromDecoratorTitle = groupsDecorator[group]?.title

			return (
				<div>
					<h1>
						{fromDecoratorIcon ? React.createElement(Icons[fromDecoratorIcon]) : null}{" "}
						{fromDecoratorTitle ?? group}
					</h1>
				</div>
			)
		}

		if (Array.isArray(data)) {
			data.forEach((item) => {
				if (typeof item.group == "undefined") {
					item.group = "none"
				}

				if (!items[item.group]) {
					items[item.group] = []
				}

				items[item.group].push(item)
			})
		}

		return Object.keys(items).map((group) => {
			return (
				<div key={group} style={{ marginBottom: "30px" }}>
					{renderGroupDecorator(group)}
					<div key={group} className="settings_groupItems">
						{renderGroupItems(group)}
					</div>
				</div>
			)
		})
	}

	renderAboutApp() {
		const appConfig = config.app
		const eviteNamespace = window.__evite
		const isDevMode = eviteNamespace.env.NODE_ENV !== "production"

		return (
			<div className="settings_about_app">
				<div>{appConfig.siteName}</div>
				<div>
					<antd.Tag>
						<Icons.Tag />v{eviteNamespace.projectVersion}
					</antd.Tag>
				</div>
				<div>
					<antd.Tag color={isDevMode ? "magenta" : "green"}>
						{isDevMode ? <Icons.Triangle /> : <Icons.Box />}
						{isDevMode ? "development" : "stable"}
					</antd.Tag>
				</div>
			</div>
		)
	}

	renderLogout() {
		if (window.app.isValidSession()) {
			return (
				<div>
					<antd.Button
						onClick={() => {
							Session.logout()
						}}
						type="danger"
					>
						Logout
					</antd.Button>
				</div>
			)
		}

		return <div></div>
	}

	render() {
		return (
			<div>
				{this.generateMenu(settingList)}
				<div className="settings_bottom_items">
					{this.renderLogout()}
					{this.renderAboutApp()}
					<antd.Button type="link" onClick={() => AboutApp.openModal()}>
						About
					</antd.Button>
				</div>
			</div>
		)
	}
}

const controller = {
	open: (key) => {
		// TODO: Scroll to content
		window.app.DrawerController.open("settings", SettingsMenu, {
			props: {
				width: "45%",
			},
		})
	},

	close: () => {
		window.app.DrawerController.close("settings")
	},
}

export default controller
