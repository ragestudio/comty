import React from "react"
import * as antd from "antd"

import { Translation } from "react-i18next"
import { SliderPicker } from "react-color"

import { Icons, createIconRender } from "components/Icons"

class PerformanceLog {
    constructor(
        id,
        params = {
            disabled: false
        }
    ) {
        this.id = id
        this.params = params

        this.table = {}

        return this
    }

    start(event) {
        if (this.params.disabled) {
            return false
        }

        if (!this.table[event]) {
            this.table[event] = {}
        }

        return this.table[event]["start"] = performance.now()
    }

    end(event) {
        if (this.params.disabled) {
            return false
        }

        if (!this.table[event]) {
            return
        }

        return this.table[event]["end"] = performance.now()
    }

    finally() {
        if (this.params.disabled) {
            return false
        }

        console.group(this.id)

        Object.entries(this.table).forEach(([entry, value]) => {
            console.log(entry, `${(value.end - value.start).toFixed(0)}ms`)
        })

        console.groupEnd()
    }
}

export const SettingsComponents = {
    button: {
        component: antd.Button,
        props: (_this) => {
            return {
                onClick: (event) => _this.onUpdateItem(event)
            }
        }
    },
    switch: {
        component: antd.Switch,
        props: (_this) => {
            return {
                onChange: (event) => _this.onUpdateItem(event)
            }
        }
    },
    slider: {
        component: antd.Slider,
        props: (_this) => {
            return {
                onAfterChange: (event) => _this.onUpdateItem(event)
            }
        }
    },
    input: {
        component: antd.Input,
        props: (_this) => {
            return {
                defaultValue: _this.state.value,
                onChange: (event) => _this.onUpdateItem(event.target.value),
                onPressEnter: (event) => _this.dispatchUpdate(event.target.value)
            }
        }
    },
    textarea: {
        component: antd.Input.TextArea,
        props: (_this) => {
            return {
                defaultValue: _this.state.value,
                onChange: (event) => _this.onUpdateItem(event.target.value),
                onPressEnter: (event) => _this.dispatchUpdate(event.target.value)
            }
        }
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
                }
            }
        }
    },
    slidercolorpicker: {
        component: SliderPicker,
        props: (_this) => {
            return {
                onChange: (color) => {
                    _this.setState({
                        componentProps: {
                            ..._this.state.componentProps,
                            color
                        }
                    })
                },
                onChangeComplete: (color) => {
                    _this.onUpdateItem(color.hex)
                },
                color: _this.state.value
            }
        }
    },
}

export default class SettingItemComponent extends React.PureComponent {
    state = {
        value: null,
        debouncedValue: null,

        componentProps: Object(),
        loading: true,
    }

    perf = new PerformanceLog(`Init ${this.props.setting.id}`, {
        disabled: true
    })

    componentType = null

    componentRef = React.createRef()

    componentDidMount = async () => {
        if (typeof this.props.setting.component === "string") {
            this.componentType = String(this.props.setting.component).toLowerCase()
        }

        await this.initialize()
    }

    componentWillUnmount = () => {
        this.setState({
            value: null,
            componentProps: Object(),
        })

        if (typeof this.props.setting.dependsOn === "object") {
            for (const key in this.props.setting.dependsOn) {
                window.app.eventBus.off(`setting.update.${key}`)
            }
        }
    }

    generateInhertedProps = () => {
        if (!SettingsComponents[this.componentType]) {
            return {}
        }

        if (typeof SettingsComponents[this.componentType].props === "function") {
            const inhertedProps = SettingsComponents[this.componentType].props(this)

            return inhertedProps
        }

        return {}
    }

    toogleLoading = (to) => {
        if (typeof to === "undefined") {
            to = !this.state.loading
        }

        this.setState({
            loading: to
        })
    }

    initialize = async () => {
        this.perf.start(`init tooks`)

        this.toogleLoading(true)

        if (this.props.setting.storaged) {
            this.perf.start(`get value from storaged`)

            await this.setState({
                value: window.app.cores.settings.get(this.props.setting.id),
            })

            this.perf.end(`get value from storaged`)
        }

        if (typeof this.props.setting.defaultValue === "function") {
            this.perf.start(`execute default value fn`)

            this.toogleLoading(true)

            this.setState({
                value: await this.props.setting.defaultValue(this.props.ctx)
            })

            this.toogleLoading(false)

            this.perf.end(`execute default value fn`)
        }

        if (typeof this.props.setting.dependsOn === "object") {
            this.perf.start(`register dependsOn events`)

            Object.keys(this.props.setting.dependsOn).forEach((key) => {
                // create a event handler to watch changes
                window.app.eventBus.on(`setting.update.${key}`, () => {
                    this.setState({
                        componentProps: {
                            ...this.state.componentProps,
                            disabled: this.checkDependsValidation()
                        }
                    })
                })
            })

            this.perf.end(`register dependsOn events`)

            this.perf.start(`check depends validation`)

            // by default check depends validation
            this.setState({
                componentProps: {
                    ...this.state.componentProps,
                    disabled: this.checkDependsValidation()
                }
            })

            this.perf.end(`check depends validation`)
        }

        if (typeof this.props.setting.listenUpdateValue === "string") {
            this.perf.start(`listen "on update" value`)

            window.app.eventBus.on(`setting.update.${this.props.setting.listenUpdateValue}`, () => {
                this.setState({
                    value: window.app.cores.settings.get(this.props.setting.id)
                })
            })

            this.perf.end(`listen "on update" value`)
        }

        if (this.props.setting.reloadValueOnUpdateEvent) {
            this.perf.start(`Reinitializing setting [${this.props.setting.id}]`)

            window.app.eventBus.on(this.props.setting.reloadValueOnUpdateEvent, () => {
                console.log(`Reinitializing setting [${this.props.setting.id}]`)
                this.initialize()
            })

            this.perf.end(`Reinitializing setting [${this.props.setting.id}]`)
        }

        this.toogleLoading(false)

        this.perf.end(`init tooks`)

        this.perf.finally()
    }

    dispatchUpdate = async (updateValue) => {
        if (typeof this.props.setting.onUpdate === "function") {
            try {
                const result = await this.props.setting.onUpdate(updateValue)

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
        }

        const storagedValue = window.app.cores.settings.get(this.props.setting.id)

        if (typeof updateValue === "undefined") {
            updateValue = !storagedValue
        }

        if (this.props.setting.storaged) {
            await window.app.cores.settings.set(this.props.setting.id, updateValue)

            if (typeof this.props.setting.beforeSave === "function") {
                await this.props.setting.beforeSave(updateValue)
            }
        }

        if (typeof this.props.setting.emitEvent !== "undefined") {
            if (typeof this.props.setting.emitEvent === "string") {
                this.props.setting.emitEvent = [this.props.setting.emitEvent]
            }

            let emissionPayload = updateValue

            if (typeof this.props.setting.emissionValueUpdate === "function") {
                emissionPayload = this.props.setting.emissionValueUpdate(emissionPayload)
            }

            for await (const event of this.props.setting.emitEvent) {
                window.app.eventBus.emit(event, emissionPayload)
            }
        }

        if (this.props.setting.noUpdate) {
            return false
        }

        // reset debounced value
        if (this.props.setting.debounced) {
            await this.setState({
                debouncedValue: null
            })
        }

        if (this.componentRef.current) {
            if (typeof this.componentRef.current.onDebounceSave === "function") {
                await this.componentRef.current.onDebounceSave(updateValue)
            }
        }

        // finaly update value
        await this.setState({
            value: updateValue
        })

        return updateValue
    }

    onUpdateItem = async (updateValue) => {
        this.setState({
            value: updateValue
        })

        if (this.props.setting.debounced) {
            return await this.setState({
                debouncedValue: updateValue
            })
        }

        return await this.dispatchUpdate(updateValue)
    }

    checkDependsValidation = () => {
        return !Boolean(Object.keys(this.props.setting.dependsOn).every((key) => {
            const storagedValue = window.app.cores.settings.get(key)

            console.debug(`Checking validation for [${key}] with now value [${storagedValue}]`)

            if (typeof this.props.setting.dependsOn[key] === "function") {
                return this.props.setting.dependsOn[key](storagedValue)
            }

            return storagedValue === this.props.setting.dependsOn[key]
        }))
    }

    render() {
        if (!this.props.setting) {
            console.error(`Item [${this.props.setting.id}] has no an setting!`)
            return null
        }

        if (!this.props.setting.component) {
            console.error(`Item [${this.props.setting.id}] has no an setting component!`)
            return null
        }

        let finalProps = {
            ...this.state.componentProps,
            ...this.props.setting.props,

            ctx: {
                updateCurrentValue: (updateValue) => this.setState({
                    value: updateValue
                }),
                getCurrentValue: () => this.state.value,
                currentValue: this.state.value,
                dispatchUpdate: this.dispatchUpdate,
                onUpdateItem: this.onUpdateItem,
            },
            ref: this.componentRef,

            ...this.generateInhertedProps(),

            // set values
            checked: this.state.value,
            value: this.state.value,

            size: app.isMobile ? "large" : "default"
        }

        if (this.props.setting.children) {
            finalProps.children = this.props.setting.children
        }

        if (app.isMobile) {
            finalProps.size = "large"
        }

        const Component = SettingsComponents[String(this.props.setting.component).toLowerCase()]?.component ?? this.props.setting.component

        return <div className="setting_item" id={this.props.setting.id} key={this.props.setting.id}>
            <div className="setting_item_header">
                <div className="setting_item_info">
                    <div className="setting_item_header_title">
                        <h1>
                            {
                                createIconRender(this.props.setting.icon)
                            }
                            <Translation>
                                {(t) => t(this.props.setting.title ?? this.props.setting.id)}
                            </Translation>
                        </h1>
                        {this.props.setting.experimental && <antd.Tag> Experimental </antd.Tag>}
                    </div>
                    <div className="setting_item_header_description">
                        <p>
                            <Translation>
                                {(t) => t(this.props.setting.description)}
                            </Translation>
                        </p>
                    </div>
                </div>

                {
                    this.props.setting.extraActions && <div className="setting_item_header_actions">
                        {
                            this.props.setting.extraActions.map((action, index) => {
                                if (typeof action === "function") {
                                    return React.createElement(action)
                                }

                                const handleOnClick = () => {
                                    if (action.onClick) {
                                        action.onClick(finalProps.ctx)
                                    }
                                }

                                return <antd.Button
                                    key={action.id}
                                    id={action.id}
                                    onClick={handleOnClick}
                                    icon={action.icon && createIconRender(action.icon)}
                                    type={action.type ?? "round"}
                                    disabled={this.props.setting.disabled}
                                >
                                    {action.title}
                                </antd.Button>
                            })
                        }
                    </div>
                }
            </div>

            <div className="setting_item_content">
                <>
                    {
                        !this.state.loading && React.createElement(Component, finalProps)
                    }
                    {
                        this.state.loading && <antd.Spin />
                    }
                    {
                        this.state.debouncedValue && <antd.Button
                            type="round"
                            icon={<Icons.Save />}
                            onClick={async () => await this.dispatchUpdate(this.state.debouncedValue)}
                        >
                            Save
                        </antd.Button>
                    }
                </>
            </div>
        </div>
    }
}