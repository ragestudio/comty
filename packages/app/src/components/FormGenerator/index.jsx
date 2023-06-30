import React from "react"
import { Icons } from "components/Icons"
import {
	Form,
	Input,
	Button,
	Checkbox,
	Select,
	Dropdown,
	Slider,
	InputNumber,
	DatePicker,
	AutoComplete,
	Divider,
	Switch,
} from "antd"
import HeadShake from "react-reveal/HeadShake"

import "./index.less"

const allComponents = {
	Input,
	Button,
	Checkbox,
	Select,
	Dropdown,
	Slider,
	InputNumber,
	DatePicker,
	AutoComplete,
	Divider,
	Switch,
}

export default class FormGenerator extends React.Component {
	ref = React.createRef()

	fieldsReferences = {}
	unsetValues = {}
	discardedValues = []

	state = {
		validating: false,
		shakeItem: false,
		failed: {},
	}

	ctx = {
		clearErrors: () => {
			this.setState({ failed: {} })
		},
		clearForm: () => {
			this.ctx.clearErrors()
			this.ctx.toggleValidation(false)
			this.ref.current.resetFields()
		},
		finish: () => this.ref.current.submit(),
		error: (id, error) => {
			this.handleFormError(id, error)
		},
		shake: (id) => {
			this.formItemShake(id)
		},
		toggleValidation: (to) => {
			if (typeof to !== "undefined") {
				return this.setState({ validating: to })
			}
			this.setState({ validating: !this.state.validating })

			return this.state.validating
		},
		formRef: this.ref,
	}

	handleFinish(payload) {
		if (typeof this.props.onFinish !== "function") {
			console.error(`onFinish is not an function`)
			return false
		}

		// try to read unset values
		Object.keys(this.fieldsReferences).forEach((key) => {
			const ref = this.fieldsReferences[key].current

			if (typeof ref.state !== "undefined") {
				this.unsetValues[key] = ref.state?.value || ref.state?.checked
			}
		})

		// filter discarded values
		try {
			const keys = Object.keys(payload)
			this.discardedValues.forEach((id) => {
				if (keys.includes(id)) {
					delete payload[id]
				}
			})
		} catch (error) {
			// terrible
		}

		// fulfil unset values
		payload = { ...payload, ...this.unsetValues }

		return this.props.onFinish(payload, this.ctx)
	}

	formItemShake(id) {
		this.setState({ shakeItem: id })
		setTimeout(() => {
			this.setState({ shakeItem: false })
		}, 50)
	}

	handleFormError(item, error) {
		let fails = this.state.failed

		fails[item] = error ?? true

		this.setState({ failed: fails })
		this.formItemShake(item)
	}

	handleFailChange(event) {
		const itemID = event.target.id
		if (itemID) {
			let fails = this.state.failed

			if (fails["all"]) {
				fails["all"] = false
				this.setState({ failed: fails })
			}

			if (fails[itemID]) {
				// try deactivate failed statement
				fails[itemID] = false
				this.setState({ failed: fails })
			}
		}
	}

	shouldShakeItem(id) {
		try {
			const mutation = false
			if (this.state.shakeItem === "all") {
				return mutation
			}
			if (this.state.shakeItem == id) {
				return mutation
			}
		} catch (error) {
			// not returning
		}
	}

	discardValueFromId = (id) => {
		let ids = []

		if (Array.isArray(id)) {
			ids = id
		} else {
			ids.push(id)
		}

		ids.forEach((_id) => {
			const value = this.discardedValues ?? []
			value.push(_id)
			this.discardedValues = value
		})
	}

	renderValidationIcon() {
		if (this.props.renderLoadingIcon && this.state.validating) {
			return <Icons.LoadingOutlined spin style={{ margin: 0 }} />
		}

		return null
	}

	renderElementPrefix = (element) => {
		if (element.icon) {
			let renderIcon = null

			const iconType = typeof element.icon
			switch (iconType) {
				case "string": {
					if (typeof Icons[element.icon] !== "undefined") {
						renderIcon = React.createElement(Icons[element.icon])
					} else {
						console.warn("provided icon is not available on icons libs")
					}
					break
				}
				case "object": {
					renderIcon = element.icon
					break
				}
				default: {
					console.warn(`cannot mutate icon cause type (${iconType}) is not handled`)
					break
				}
			}
			if (renderIcon) {
				// try to generate icon with props
				return React.cloneElement(renderIcon, element.iconProps ? { ...element.iconProps } : null)
			}
		} else {
			return element.prefix ?? null
		}
	}

	renderItems(elements) {
		if (Array.isArray(elements)) {
			try {
				return elements.map((field) => {
					let { item, element } = field

					// if item has no id, return an uncontrolled field
					if (typeof field.id === "undefined") {
						return React.createElement(allComponents[element.component], element.props)
					}

					// fulfill
					if (typeof item === "undefined") {
						item = {}
					}
					if (typeof element === "undefined") {
						element = {}
					}

					// check if component is available on library
					if (typeof allComponents[element.component] === "undefined") {
						console.warn(`[${element.component}] is not an valid component`)
						return null
					}

					// handle groups
					if (typeof field.group !== "undefined") {
						return (
							<div style={{ display: "flex" }} key={field.id}>
								{this.renderItems(field.group)}
							</div>
						)
					}

					//* RENDER
					const failStatement = this.state.failed["all"] ?? this.state.failed[field.id]

					const rules = item.rules
					const hasFeedback = item.hasFeedback ?? false

					let elementProps = {
						disabled: this.state.validating,
						...element.props,
					}
					let itemProps = {
						...item.props,
					}

					switch (element.component) {
						case "Checkbox": {
							elementProps.onChange = (e) => {
								this.unsetValues[field.id] = e.target.checked
								elementProps.checked = e.target.checked
								elementProps.value = e.target.checked
							}
							break
						}
						case "Button": {
							this.discardValueFromId(field.id)
							if (field.withValidation) {
								elementProps.icon = this.state.validating ? (
									<Icons.LoadingOutlined spin style={{ marginRight: "7px" }} />
								) : null
							}
							break
						}
						case "Input": {
							itemProps = {
								...itemProps,
								hasFeedback,
								rules,
								onChange: (e) => this.handleFailChange(e),
								help: failStatement ? failStatement : null,
								validateStatus: failStatement ? "error" : null,
							}
							elementProps = {
								...elementProps,
								id: field.id,
								prefix: this.renderElementPrefix(element) ?? null,
								placeholder: element.placeholder,
							}
							break
						}
						case "Select": {
							if (typeof element.renderItem !== "undefined") {
								elementProps.children = element.renderItem
							}
							if (typeof element.options !== "undefined" && !element.renderItem) {
								if (!Array.isArray(element.options)) {
									console.warn(
										`Invalid options data type, expecting Array > received ${typeof element.options}`,
									)
									return null
								}
								elementProps.children = element.options.map((option) => {
									return (
										<Select.Option key={option.id ?? Math.random} value={option.value ?? option.id}>
											{option.name ?? null}
										</Select.Option>
									)
								})
							}
							itemProps = {
								...itemProps,
								hasFeedback,
								rules,
								validateStatus: failStatement ? "error" : null,
								help: failStatement ? failStatement : null,
							}
							break
						}
						default: {
							itemProps = {
								...itemProps,
								hasFeedback,
								rules,
								validateStatus: failStatement ? "error" : null,
								help: failStatement ? failStatement : null,
							}
							break
						}
					}

					// set reference
					this.fieldsReferences[field.id] = elementProps.ref = React.createRef()

					// return field
					return (
						<div className={field.className} style={field.style} key={field.id}>
							{field.title ?? null}
							<HeadShake spy={this.shouldShakeItem(field.id)}>
								<Form.Item label={field.label} name={field.id} key={field.id} {...itemProps}>
									{React.createElement(allComponents[element.component], elementProps)}
								</Form.Item>
							</HeadShake>
						</div>
					)
				})
			} catch (error) {
				console.log(error)
				return null
			}
		}
	}

	componentDidMount() {
		if (!this.props.items) {
			console.warn(`items not provided, nothing to render`)
			return null
		}

		// handle discardedValues
		if (Array.isArray(this.props.items)) {
			this.props.items.forEach((item) => {
				if (item.ignoreValue) {
					this.discardValueFromId(item.id)
				}
			})
		}
	}

	render() {
		const helpStatus = this.state.failed["all"] ?? this.state.failed["result"]
		const validateStatus = this.state.failed["all"] || this.state.failed["result"] ? "error" : null

		if (!this.props.items) {
			console.warn(`Nothing to render`)
			return null
		}

		return <div
			key={this.props.id}
			id={this.props.id}
			className="formWrapper"
		>
			<Form
				hideRequiredMark={this.props.hideRequiredMark ?? false}
				name={this.props.name ?? "new_form"}
				onFinish={(e) => this.handleFinish(e)}
				ref={this.ref}
				{...this.props.formProps}
			>
				{this.renderItems(this.props.items)}
				<Form.Item key="result" help={helpStatus} validateStatus={validateStatus} />
			</Form>
			{this.renderValidationIcon()}
		</div>
	}
}