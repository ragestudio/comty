import React from "react"
import * as antd from "antd"
import { SliderPicker } from "react-color"
import { Translation } from "react-i18next"
import classnames from "classnames"

import config from "config"
import { Icons, createIconRender } from "components/Icons"

import AppSettings from "schemas/settings/app"
import AccountSettings from "schemas/settings/account"

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

const SettingItem = (props) => {
	let { item } = props
	const [loading, setLoading] = React.useState(true)
	const [value, setValue] = React.useState(item.defaultValue ?? false)
	const [delayedValue, setDelayedValue] = React.useState(null)

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

	const dispatchUpdate = async (updateValue) => {
		if (typeof item.onUpdate === "function") {
			const result = await item.onUpdate(updateValue).catch((error) => {
				console.error(error)
				antd.message.error(error.message)
				return false
			})

			if (!result) {
				return false
			}
			updateValue = result
		} else {
			const storagedValue = await window.app.settings.get(item.id)

			if (typeof updateValue === "undefined") {
				updateValue = !storagedValue
			}
		}

		if (typeof item.emitEvent === "string") {
			let emissionPayload = updateValue

			if (typeof item.emissionValueUpdate === "function") {
				emissionPayload = item.emissionValueUpdate(emissionPayload)
			}

			window.app.eventBus.emit(item.emitEvent, emissionPayload)
		}

		if (item.noUpdate) {
			return false
		}

		if (item.storaged) {
			await window.app.settings.set(item.id, updateValue)
		}

		if (item.debounced) {
			setDelayedValue(null)
		}

		setValue(updateValue)
	}

	const onUpdateItem = async (updateValue) => {
		setValue(updateValue)

		if (!item.debounced) {
			await dispatchUpdate(updateValue)
		} else {
			setDelayedValue(updateValue)
		}
	}

	const settingInitialization = async () => {
		if (item.storaged) {
			const storagedValue = window.app.settings.get(item.id)
			setValue(storagedValue)
		}

		if (typeof item.defaultValue === "function") {
			setValue(await item.defaultValue())
		}

		if (typeof item.dependsOn === "object") {
			const dependsOptionsKeys = Object.keys(item.dependsOn)

			item.props.disabled = !Boolean(dependsOptionsKeys.every((key) => {
				const storagedValue = window.app.settings.get(key)

				if (typeof item.dependsOn[key] === "function") {
					return item.dependsOn[key](storagedValue)
				}

				return storagedValue === item.dependsOn[key]
			}))
		}

		if (typeof item.listenUpdateValue === "string") {
			window.app.eventBus.on(`setting.update.${item.listenUpdateValue}`, (value) => setValue(value))
		}

		if (item.reloadValueOnUpdateEvent) {
			window.app.eventBus.on(item.reloadValueOnUpdateEvent, () => {
				console.log(`Reloading value for item [${item.id}]`)
				settingInitialization()
			})
		}

		setLoading(false)
	}

	React.useEffect(() => {
		settingInitialization()
	}, [])

	switch (item.type.toLowerCase()) {
		case "slidercolorpicker": {
			item.props.onChange = (color) => {
				item.props.color = color.hex
			}
			item.props.onChangeComplete = (color) => {
				onUpdateItem(color.hex)
			}

			item.props.color = value

			break
		}
		case "input": {
			item.props.defaultValue = value
			item.props.onPressEnter = (event) => dispatchUpdate(event.target.value)
			item.props.onChange = (event) => onUpdateItem(event.target.value)
			break
		}
		case "switch": {
			item.props.checked = value
			item.props.onClick = (event) => onUpdateItem(event)
			break
		}
		case "select": {
			item.props.onChange = (value) => onUpdateItem(value)
			item.props.defaultValue = value
			break
		}
		case "slider": {
			item.props.defaultValue = value
			item.props.onAfterChange = (value) => onUpdateItem(value)
			break
		}
		default: {
			if (!item.props.children) {
				item.props.children = item.title ?? item.id
			}
			item.props.value = item.defaultValue
			item.props.onClick = (event) => onUpdateItem(event)
			break
		}
	}

	return <div key={item.id} className="settingItem">
		<div className="header">
			<div className="title">
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
			{item.extraActions &&
				<div className="extraActions">
					{item.extraActions.map((action, index) => {
						return <div>
							<antd.Button
								key={action.id}
								id={action.id}
								onClick={action.onClick}
								icon={action.icon && createIconRender(action.icon)}
								type={action.type ?? "round"}
							>
								{action.title}
							</antd.Button>
						</div>
					})}
				</div>
			}
		</div>
		<div className="component">
			<div>
				{loading ? <div> Loading... </div> : React.createElement(ItemTypes[item.type], item.props)}
			</div>

			{delayedValue && <div>
				<antd.Button
					type="round"
					icon={<Icons.Save />}
					onClick={async () => await dispatchUpdate(value)}
				>
					Save
				</antd.Button>
			</div>}
		</div>
	</div>
}

export default class SettingsMenu extends React.PureComponent {
	state = {
		transitionActive: false,
		activeKey: "app"
	}

	componentDidMount() {
		if (typeof this.props.close === "function") {
			// register escape key to close settings menu
			window.addEventListener("keydown", this.handleKeyDown)
		}
	}

	componentWillUnmount() {
		if (typeof this.props.close === "function") {
			window.removeEventListener("keydown", this.handleKeyDown)
		}
	}

	handleKeyDown = (event) => {
		if (event.key === "Escape") {
			this.props.close()
		}
	}

	handlePageTransition = (key) => {
		this.setState({
			transitionActive: true,
		})

		setTimeout(() => {
			this.setState({
				activeKey: key
			})

			setTimeout(() => {
				this.setState({
					transitionActive: false,
				})
			}, 100)
		}, 100)
	}

	renderSettings = (key, group) => {
		const fromDecoratorIcon = groupsDecorator[key]?.icon
		const fromDecoratorTitle = groupsDecorator[key]?.title

		return <div className={classnames("fade-opacity-active", { "fade-opacity-leave": this.state.transitionActive })}>
			<div key={key} className="group">
				<h1>
					{fromDecoratorIcon ? React.createElement(Icons[fromDecoratorIcon]) : null}
					<Translation>{
						t => t(fromDecoratorTitle ?? key)
					}</Translation>
				</h1>
				<div className="content">
					{group.map((item) => <SettingItem item={item} />)}
				</div>
			</div>
		</div>
	}

	generateSettingsGroups = (data) => {
		let groups = {}

		data.forEach((item) => {
			if (!groups[item.group]) {
				groups[item.group] = []
			}

			groups[item.group].push(item)
		})

		return Object.keys(groups).map((groupKey) => {
			return this.renderSettings(groupKey, groups[groupKey])
		})
	}

	render() {
		const isDevMode = window.__evite?.env?.NODE_ENV !== "production"

		return (
			<div className="settings">
				<antd.Tabs
					activeKey={this.state.activeKey}
					centered
					destroyInactiveTabPane
					onTabClick={this.handlePageTransition}
				>
					<antd.Tabs.TabPane
						key="app"
						tab={
							<span>
								<Icons.Command />
								App
							</span>
						}
					>
						{this.generateSettingsGroups(AppSettings)}
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
					</antd.Tabs.TabPane>
					<antd.Tabs.TabPane
						key="account"
						tab={
							<span>
								<Icons.User />
								Account
							</span>
						}
					>
						{this.generateSettingsGroups(AccountSettings)}
					</antd.Tabs.TabPane>
					<antd.Tabs.TabPane
						key="security"
						tab={
							<span>
								<Icons.Shield />
								Security
							</span>
						}
					>
					</antd.Tabs.TabPane>
					<antd.Tabs.TabPane
						key="privacy"
						tab={
							<span>
								<Icons.Eye />
								Privacy
							</span>
						}
					>
					</antd.Tabs.TabPane>
				</antd.Tabs>
			</div>
		)
	}
}