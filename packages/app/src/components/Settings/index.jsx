import React from "react"
import * as antd from "antd"
import { SliderPicker } from "react-color"
import { Translation } from "react-i18next"
import classnames from "classnames"

import config from "config"
import { Icons, createIconRender } from "components/Icons"

import SettingsList from "schemas/settings"
import groupsDecorator from "schemas/settingsGroupsDecorator.json"

import "./index.less"

const ItemTypes = {
	Button: antd.Button,
	Switch: antd.Switch,
	Slider: antd.Slider,
	Checkbox: antd.Checkbox,
	Input: antd.Input,
	TextArea: antd.Input.TextArea,
	InputNumber: antd.InputNumber,
	Select: antd.Select,
	SliderColorPicker: SliderPicker,
}

const SettingsFooter = (props) => {
	const isDevMode = window.__evite?.env?.NODE_ENV !== "production"

	return <div className="footer" >
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
			<antd.Button type="link" onClick={props.onClickAppAbout}>
				<Translation>
					{t => t("about")}
				</Translation>
			</antd.Button>
		</div>
	</div>
}

const SettingItem = (props) => {
	let { item } = props

	const [loading, setLoading] = React.useState(true)
	const [value, setValue] = React.useState(null)
	const [delayedValue, setDelayedValue] = React.useState(null)
	const [disabled, setDisabled] = React.useState(false)

	let SettingComponent = item.component

	if (!SettingComponent) {
		console.error(`Item [${item.id}] has no an component!`)
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

		if (item.storaged) {
			await window.app.settings.set(item.id, updateValue)
		}

		if (typeof item.emitEvent !== "undefined") {
			let emissionPayload = updateValue

			if (typeof item.emissionValueUpdate === "function") {
				emissionPayload = item.emissionValueUpdate(emissionPayload)
			}

			if (Array.isArray(item.emitEvent)) {
				window.app.eventBus.emit(...item.emitEvent, emissionPayload)
			} else if (typeof item.emitEvent === "string") {
				window.app.eventBus.emit(item.emitEvent, emissionPayload)
			}
		}

		if (item.noUpdate) {
			return false
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

	const checkDependsValidation = () => {
		return !Boolean(Object.keys(item.dependsOn).every((key) => {
			const storagedValue = window.app.settings.get(key)

			console.debug(`Checking validation for [${key}] with now value [${storagedValue}]`)

			if (typeof item.dependsOn[key] === "function") {
				return item.dependsOn[key](storagedValue)
			}

			return storagedValue === item.dependsOn[key]
		}))
	}

	const settingInitialization = async () => {
		if (item.storaged) {
			const storagedValue = window.app.settings.get(item.id)
			setValue(storagedValue)
		}

		if (typeof item.defaultValue === "function") {
			setLoading(true)

			setValue(await item.defaultValue(props.ctx))

			setLoading(false)
		}

		if (item.disabled === true) {
			setDisabled(true)
		}

		if (typeof item.dependsOn === "object") {
			// create a event handler to watch changes
			Object.keys(item.dependsOn).forEach((key) => {
				window.app.eventBus.on(`setting.update.${key}`, () => {
					setDisabled(checkDependsValidation())
				})
			})

			// by default check depends validation
			setDisabled(checkDependsValidation())
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

		return () => {
			if (typeof item.dependsOn === "object") {
				for (let key in item.dependsOn) {
					window.app.eventBus.off(`setting.update.${key}`, onUpdateItem)
				}
			}
		}
	}, [])

	if (typeof SettingComponent === "string") {
		if (typeof ItemTypes[SettingComponent] === "undefined") {
			console.error(`Item [${item.id}] has an invalid component: ${item.component}`)
			return null
		}

		switch (SettingComponent.toLowerCase()) {
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
			case "textarea": {
				item.props.defaultValue = value
				item.props.onPressEnter = (event) => dispatchUpdate(event.target.value)
				item.props.onChange = (event) => onUpdateItem(event.target.value)
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

		// override with default item component
		SettingComponent = ItemTypes[SettingComponent]
	}

	item.props["disabled"] = disabled

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
				{
					loading
						? <div> Loading... </div>
						: React.createElement(SettingComponent, {
							...item.props,
							ctx: {
								currentValue: value,
								dispatchUpdate,
								onUpdateItem,
								...props.ctx,
							}
						})}
			</div>

			{
				delayedValue && <div>
					<antd.Button
						type="round"
						icon={<Icons.Save />}
						onClick={async () => await dispatchUpdate(value)}
					>
						Save
					</antd.Button>
				</div>
			}
		</div>
	</div>
}

const SettingGroup = React.memo((props) => {
	const {
		ctx,
		groupKey,
		settings,
		loading,
	} = props

	const fromDecoratorIcon = groupsDecorator[groupKey]?.icon
	const fromDecoratorTitle = groupsDecorator[groupKey]?.title

	if (loading) {
		return <antd.Skeleton active />
	}

	return <div index={groupKey} key={groupKey} className="group">
		<h1>
			{
				fromDecoratorIcon ? React.createElement(Icons[fromDecoratorIcon]) : null
			}
			<Translation>
				{
					t => t(fromDecoratorTitle ?? groupKey)
				}
			</Translation>
		</h1>
		<div className="content">
			{
				settings.map((item) => <SettingItem
					item={item}
					ctx={ctx}
				/>)
			}
		</div>
	</div>
})

const SettingTab = React.memo((props) => {
	const { tab } = props

	const [loading, setLoading] = React.useState(true)
	const [ctxData, setCtxData] = React.useState(null)

	let groupsSettings = {}

	if (!Array.isArray(tab.settings)) {
		console.error("Cannot generate settings from non-array")
		return groupsSettings
	}

	tab.settings.forEach((item) => {
		if (!groupsSettings[item.group]) {
			groupsSettings[item.group] = []
		}

		groupsSettings[item.group].push(item)
	})

	const processCtx = async () => {
		setLoading(true)

		if (typeof tab.ctxData === "function") {
			const resultCtx = await tab.ctxData()

			setCtxData(resultCtx)
		}

		setLoading(false)
	}

	React.useEffect(() => {
		processCtx()
	}, [])

	return Object.keys(groupsSettings).map((groupKey) => {
		return <SettingGroup
			groupKey={groupKey}
			settings={groupsSettings[groupKey]}
			loading={loading}
			ctx={ctxData}
		/>
	})
})

const SettingsTabs = Object.keys(SettingsList).map((settingsKey) => {
	const tab = SettingsList[settingsKey]

	return {
		key: settingsKey,
		label: <>
			{createIconRender(tab.icon ?? "Settings")}
			{tab.label}
		</>,
		children: <SettingTab
			tab={tab}
		/>
	}
})

export default class SettingsMenu extends React.PureComponent {
	state = {
		activeKey: "app"
	}

	componentDidMount = async () => {
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

	onClickAppAbout = () => {
		window.app.setLocation("/about")

		if (typeof this.props.close === "function") {
			this.props.close()
		}
	}

	changeTab = (activeKey) => {
		this.setState({ activeKey })
	}

	render() {
		return <div
			className={classnames(
				"settings_wrapper",
				{
					["mobile"]: window.isMobile,
				}
			)}
		>
			<div className="settings">
				<antd.Tabs
					activeKey={this.state.activeKey}
					onTabClick={this.changeTab}
					tabPosition={window.isMobile ? "top" : "left"}
					centered={window.isMobile}
					destroyInactiveTabPane
					items={SettingsTabs}
				/>

				<SettingsFooter onClickAppAbout={this.onClickAppAbout} />
			</div>
		</div>
	}
}