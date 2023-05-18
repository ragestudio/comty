import React from "react"
import * as antd from "antd"
import { SliderPicker } from "react-color"
import { Translation } from "react-i18next"
import classnames from "classnames"
import config from "config"
import useUrlQueryActiveKey from "hooks/useUrlQueryActiveKey"

import AuthModel from "models/auth"

import { Icons, createIconRender } from "components/Icons"

import getSettingsList from "schemas/settings"
import menuGroupsDecorators from "schemas/settingsMenuGroupsDecorators"
import groupsDecorators from "schemas/settingsGroupsDecorators"

import "./index.less"

const SettingsList = await getSettingsList()

const extraMenuItems = [
    {
        id: "donate",
        label: "Support us",
        icon: "Heart",
        props: {
            style: {
                color: "#f72585"
            }
        }
    },
    {
        id: "logout",
        label: "Logout",
        icon: "MdOutlineLogout",
        danger: true
    }
]

const menuEvents = {
    "donate": () => {
        if (config.fundingLink) {
            window.open(config.fundingLink, "_blank")
        }
    },
    "logout": () => {
        antd.Modal.confirm({
            title: "Logout",
            content: "Are you sure you want to logout?",
            onOk: () => {
                AuthModel.logout()
            },
        })
    }
}

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

const SettingItem = (props) => {
    let { item } = props

    const [loading, setLoading] = React.useState(true)
    const [value, setValue] = React.useState(null)
    const [delayedValue, setDelayedValue] = React.useState(null)
    const [disabled, setDisabled] = React.useState(false)
    const componentRef = React.useRef(null)

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
            try {
                const result = await item.onUpdate(updateValue)

                if (result) {
                    updateValue = result
                }
            } catch (error) {
                console.error(error)

                if (error.response.data.error) {
                    app.message.error(error.response.data.error)
                } else {
                    app.message.error(error.message)
                }

                return false
            }
        } else {
            const storagedValue = await window.app.cores.settings.get(item.id)

            if (typeof updateValue === "undefined") {
                updateValue = !storagedValue
            }
        }

        if (item.storaged) {
            await window.app.cores.settings.set(item.id, updateValue)
        }

        if (item.storaged && typeof item.beforeSave === "function") {
            await item.beforeSave(updateValue)
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

        if (componentRef.current) {
            if (typeof componentRef.current.onDebounceSave === "function") {
                await componentRef.current.onDebounceSave(updateValue)
            }
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
            const storagedValue = window.app.cores.settings.get(key)

            console.debug(`Checking validation for [${key}] with now value [${storagedValue}]`)

            if (typeof item.dependsOn[key] === "function") {
                return item.dependsOn[key](storagedValue)
            }

            return storagedValue === item.dependsOn[key]
        }))
    }

    const settingInitialization = async () => {
        if (item.storaged) {
            const storagedValue = window.app.cores.settings.get(item.id)
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

    const elementsCtx = {
        updateCurrentValue: (value) => setValue(value),
        currentValue: value,
        dispatchUpdate,
        onUpdateItem,
        ...props.ctx,
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
                        if (typeof action === "function") {
                            return React.createElement(action, {
                                ctx: elementsCtx,
                            })
                        }

                        const handleOnClick = () => {
                            if (action.onClick) {
                                action.onClick(elementsCtx)
                            }
                        }

                        return <antd.Button
                            key={action.id}
                            id={action.id}
                            onClick={handleOnClick}
                            icon={action.icon && createIconRender(action.icon)}
                            type={action.type ?? "round"}
                            disabled={item.props.disabled}
                        >
                            {action.title}
                        </antd.Button>
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
                            ctx: elementsCtx,
                            ref: componentRef,
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
        disabled
    } = props

    const fromDecoratorIcon = groupsDecorators[groupKey]?.icon
    const fromDecoratorTitle = groupsDecorators[groupKey]?.title

    if (loading) {
        return <antd.Skeleton active />
    }

    if (disabled) {
        return null
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

const SettingTab = (props) => {
    const [groups, setGroups] = React.useState({})
    const [loading, setLoading] = React.useState(true)
    const [ctxData, setCtxData] = React.useState({})

    const processCtx = async () => {
        setLoading(true)

        if (typeof props.tab.ctxData === "function") {
            const resultCtx = await props.tab.ctxData()

            setCtxData(resultCtx)
        }

        setLoading(false)
    }

    React.useEffect(() => {
        if (!Array.isArray(props.tab.settings)) {
            console.error("Cannot generate settings from non-array")

            return []
        }

        let groupsSettings = {}

        props.tab.settings.forEach((item) => {
            if (!groupsSettings[item.group]) {
                groupsSettings[item.group] = []
            }

            groupsSettings[item.group].push(item)
        })

        setGroups(groupsSettings)

        processCtx()
    }, [props.tab])

    if (loading) {
        return <antd.Skeleton active />
    }

    return Object.keys(groups).map((groupKey) => {
        return <SettingGroup
            groupKey={groupKey}
            settings={groups[groupKey]}
            loading={loading}
            ctx={ctxData}
        />
    })
}

const generateMenuItems = () => {
    const groups = {}

    Object.keys(SettingsList).forEach((tabKey) => {
        const tab = SettingsList[tabKey]

        if (!tab.group) {
            tab.group = "Others"
        }

        groups[tab.group] = groups[tab.group] ?? []

        groups[tab.group].push(tab)
    })

    if (typeof groups["bottom"] === undefined) {
        groups["bottom"] = []
    }

    // add extra menu items
    extraMenuItems.forEach((item) => {
        groups["bottom"].push(item)
    })

    let groupsKeys = Object.keys(groups)

    //  make "bottom" group last
    groupsKeys = groupsKeys.sort((a, b) => {
        if (a === "bottom") {
            return 1
        }

        if (b === "bottom") {
            return -1
        }

        return 0
    })

    return groupsKeys.map((groupKey, index) => {
        const ordererItems = groups[groupKey].sort((a, b) => {
            if (typeof a.order === "undefined") {
                a.order = groups[groupKey].indexOf(a)
            }

            if (typeof b.order === "undefined") {
                b.order = groups[groupKey].indexOf(b)
            }

            // if value is close to 0, more to the top
            return a.order - b.order
        })

        const children = ordererItems.map((item) => {
            return {
                key: item.id,
                label: <div {...item.props}>
                    {createIconRender(item.icon ?? "Settings")}
                    {item.label}
                </div>,
                type: "item",
                danger: item.danger,
                disabled: item.disabled,
            }
        })

        if (index !== groupsKeys.length - 1) {
            children.push({
                type: "divider",
            })
        }

        return {
            key: groupKey,
            label: groupKey === "bottom" ? null : <>
                {
                    menuGroupsDecorators[groupKey]?.icon && createIconRender(menuGroupsDecorators[groupKey]?.icon ?? "Settings")
                }
                <Translation>
                    {
                        t => t(menuGroupsDecorators[groupKey]?.label ?? groupKey)
                    }
                </Translation>
            </>,
            type: "group",
            children: children,
        }
    })
}

export default () => {
    const [activeKey, setActiveKey] = useUrlQueryActiveKey({
        defaultKey: "general",
        queryKey: "tab"
    })

    const [menuItems, setMenuItems] = React.useState([])

    const onChangeTab = (event) => {
        if (typeof menuEvents[event.key] === "function") {
            return menuEvents[event.key]()
        }

        app.cores.sound.useUIAudio("navigation")

        setActiveKey(event.key)
    }

    React.useEffect(() => {
        setMenuItems(generateMenuItems())
    }, [])

    return <div
        className={classnames(
            "settings_wrapper",
            {
                ["mobile"]: window.isMobile,
            }
        )}
    >
        <div className="settings_menu">
            <antd.Menu
                mode="vertical"
                items={menuItems}
                onClick={onChangeTab}
                selectedKeys={[activeKey]}
            />
        </div>

        <div className="settings_content">
            {
                SettingsList[activeKey] &&
                React.createElement(SettingsList[activeKey].render ?? SettingTab, {
                    tab: SettingsList[activeKey],
                })
            }
        </div>
    </div>
}