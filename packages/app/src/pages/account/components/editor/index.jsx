import React from "react"
import debounce from "lodash/debounce"
import { Icons } from "components/Icons"

import classnames from "classnames"
import * as antd from "antd"

import "./index.less"

export const EditAccountField = ({ id, component, props, header, handleChange, delay, defaultValue, allowEmpty }) => {
	const [currentValue, setCurrentValue] = React.useState(defaultValue)
	const [emittedValue, setEmittedValue] = React.useState(null)

	const debouncedHandleChange = React.useCallback(
		debounce((value) => handleChange({ id, value }), delay ?? 300),
		[],
	)

	const handleDiscard = (event) => {
		if (typeof event !== "undefined") {
			event.target.blur()
		}

		setCurrentValue(defaultValue)
		handleChange({ id, value: defaultValue })
	}

	React.useEffect(() => {
		debouncedHandleChange(currentValue)
	}, [emittedValue])

	const onChange = (event) => {
		event.persist()
		let { value } = event.target

		if (typeof value === "string") {
			if (value.length === 0) {
				// if is not allowed to be empty, discard modifications
				if (!allowEmpty) {
					return handleDiscard(event)
				}
			}
		}

		setCurrentValue(value)
		setEmittedValue(value)
	}

	const handleKeyDown = (event) => {
		if (event.keyCode === 27) {
			// "escape" pressed, reset to default value
			handleDiscard(event)
		}
	}

	window.app.eventBus.on("discardAllChanges", () => {
		setCurrentValue(defaultValue)
	})

	const RenderComponent = component
	return (
		<div key={id} className="edit_account_field">
			{header ? header : null}
			<RenderComponent {...props} value={currentValue} id={id} onChange={onChange} onKeyDown={handleKeyDown} />
		</div>
	)
}

export default class EditAccount extends React.Component {
	state = {
		values: this.props.user ?? {},
		changes: [],
		loading: false,
	}

	toogleLoading = (to) => {
		this.setState({ loading: to ?? !this.state.loading })
	}

	onSaveDone = (error, data) => {
		this.setState({ changes: [] })
		this.toogleLoading(false)
	}

	onSave = () => {
		this.props.onSave(this.state.changes, this.onSaveDone)
	}

	discardAll = () => {
		window.app.eventBus.emit("discardAllChanges")
		this.setState({ changes: [] }) // clean changes after emit, cause controller wont handle changes
	}

	handleChange = (event) => {
		const { id, value } = event
		let changes = [...this.state.changes]

		changes = changes.filter((change) => change.id !== id)

		if (this.state.values[id] !== value) {
			// changes detected
			changes.push({ id, value })
		}

		this.setState({ changes })
	}

	renderActions = () => {
		return (
			<div className={classnames("edit_account_actions", { ["show"]: this.state.changes.length > 0 })}>
				<div className="edit_account_actions_indicator">
					{this.state.loading && <Icons.LoadingOutlined style={{ marginRight: "20px" }} />}
					{this.state.changes.length} Changes
				</div>
				<div>
					<antd.Button disabled={this.state.loading} type="primary" onClick={this.onSave}>
						Save
					</antd.Button>
				</div>
				<div>
					<antd.Button disabled={this.state.loading} onClick={this.discardAll}>
						Discard all
					</antd.Button>
				</div>
			</div>
		)
	}

	render() {
		const { username, fullName, email } = this.state.values

		return (
			<div className="edit_account">
				{this.renderActions()}
				<div className="edit_account_wrapper">
					<div className="edit_account_category">
						<h2>
							<Icons.User /> Account information
						</h2>
						<EditAccountField
							id="username"
							defaultValue={username}
							header={
								<div>
									<Icons.Tag /> Username
								</div>
							}
							component={antd.Input}
							props={{ placeholder: "Username", disabled: true }}
							handleChange={this.handleChange}
						/>
						<EditAccountField
							id="fullName"
							defaultValue={fullName}
							header={
								<div>
									<Icons.User /> Name
								</div>
							}
							component={antd.Input}
							props={{ placeholder: "Your full name" }}
							handleChange={this.handleChange}
						/>
						<EditAccountField
							id="email"
							defaultValue={email}
							header={
								<div>
									<Icons.Mail /> Email
								</div>
							}
							component={antd.Input}
							props={{ placeholder: "Your email address", type: "email" }}
							handleChange={this.handleChange}
						/>
					</div>
				</div>
			</div>
		)
	}
}
