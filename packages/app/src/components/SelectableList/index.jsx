import React from "react"
import * as antd from "antd"
import { Button } from "antd"
import classnames from "classnames"
import _ from "lodash"
import { Translation } from "react-i18next"

import { Icons, createIconRender } from "components/Icons"
import { ActionsBar, } from "components"
import { useLongPress, Haptics } from "utils"

import "./index.less"

const ListItem = React.memo((props) => {
	let { item } = props

	if (!item.key) {
		item.key = item._id ?? item.id
	}

	const doubleClickSpeed = 400
	let delayedClick = null
	let clickedOnce = null

	const handleOnceClick = () => {
		clickedOnce = null

		if (typeof props.onClickItem === "function") {
			return props.onClickItem(item.key)
		}
	}

	const handleDoubleClick = () => {
		if (typeof props.onDoubleClickItem === "function") {
			return props.onDoubleClickItem(item.key)
		}
	}

	const handleLongPress = () => {
		if (typeof props.onLongPressItem === "function") {
			return props.onLongPressItem(item.key)
		}
	}

	const renderChildren = props.renderChildren(item)
	const isDisabled = renderChildren.props.disabled

	return React.createElement("div", {
		id: item.key,
		key: item.key,
		disabled: isDisabled,
		className: classnames("selectableList_item", {
			["selected"]: props.selected,
			["disabled"]: isDisabled,
		}),
		onDoubleClick: () => {
			if (isDisabled) {
				return false
			}

			handleDoubleClick()
		},
		...useLongPress(
			// onLongPress
			() => {
				if (isDisabled) {
					return false
				}

				if (props.onlyClickSelection) {
					return false
				}

				handleLongPress()
			},
			// onClick
			() => {
				if (isDisabled) {
					return false
				}

				if (props.onlyClickSelection) {
					return handleOnceClick()
				}

				if (!delayedClick) {
					delayedClick = _.debounce(handleOnceClick, doubleClickSpeed)
				}

				if (clickedOnce) {
					delayedClick.cancel()
					clickedOnce = false
					handleDoubleClick()
				} else {
					clickedOnce = true
					delayedClick()
				}
			},
			{
				shouldPreventDefault: true,
				delay: props.longPressDelay ?? 300,
			}
		),
	}, renderChildren)
})

export default class SelectableList extends React.Component {
	state = {
		selectedKeys: [],
		selectionEnabled: false,
	}

	componentDidMount() {
		if (typeof this.props.defaultSelected !== "undefined" && Array.isArray(this.props.defaultSelected)) {
			this.setState({
				selectedKeys: [...this.props.defaultSelected],
			})
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.selectionEnabled !== this.state.selectionEnabled) {
			if (this.state.selectionEnabled) {
				this.handleFeedbackEvent("selectionStart")
			} else {
				this.handleFeedbackEvent("selectionEnd")
			}
		}
	}

	handleFeedbackEvent = (event) => {
		if (typeof Haptics[event] === "function") {
			return Haptics[event]()
		}
	}

	isKeySelected = (key) => {
		return this.state.selectedKeys.includes(key)
	}

	isAllSelected = () => {
		return this.state.selectedKeys.length === this.props.items.length
	}

	selectAll = () => {
		if (this.props.items.length > 0) {
			let updatedSelectedKeys = [...this.props.items.map((item) => item.key ?? item.id ?? item._id)]

			if (typeof this.props.disabledKeys !== "undefined") {
				updatedSelectedKeys = updatedSelectedKeys.filter((key) => {
					return !this.props.disabledKeys.includes(key)
				})
			}

			this.handleFeedbackEvent("selectionChanged")

			this.setState({
				selectionEnabled: true,
				selectedKeys: updatedSelectedKeys,
			})
		}
	}

	unselectAll = () => {
		this.setState({
			selectionEnabled: false,
			selectedKeys: [],
		})
	}

	selectKey = (key) => {
		let list = this.state.selectedKeys ?? []
		list.push(key)

		this.handleFeedbackEvent("selectionChanged")

		return this.setState({ selectedKeys: list })
	}

	unselectKey = (key) => {
		let list = this.state.selectedKeys ?? []
		list = list.filter((_key) => key !== _key)

		this.handleFeedbackEvent("selectionChanged")

		return this.setState({ selectedKeys: list })
	}

	onDone = () => {
		if (typeof this.props.onDone === "function") {
			this.props.onDone(this.state.selectedKeys)
		}
		this.unselectAll()
	}

	onDiscard = () => {
		if (typeof this.props.onDiscard === "function") {
			this.props.onDiscard(this.state.selectedKeys)
		}
		this.unselectAll()
	}

	onDoubleClickItem = (key) => {
		if (typeof this.props.onDoubleClick === "function") {
			this.props.onDoubleClick(key)
		}
	}

	onClickItem = (key) => {
		if (this.props.overrideSelectionEnabled || this.state.selectionEnabled) {
			if (this.isKeySelected(key)) {
				this.unselectKey(key)
			} else {
				this.selectKey(key)
			}
		} else {
			if (typeof this.props.onClickItem === "function") {
				this.props.onClickItem(key)
			}
		}
	}

	onLongPressItem = (key) => {
		if (this.props.overrideSelectionEnabled) {
			return false
		}

		if (!this.state.selectionEnabled) {
			this.selectKey(key)
			this.setState({ selectionEnabled: true })
		}
	}

	renderProvidedActions = () => {
		return this.props.actions.map((action) => {
			return (
				<div key={action.key}>
					<Button
						type={action.props.type}
						shape={action.props.shape}
						size={action.props.size}
						style={{
							...action.props.style,
						}}
						onClick={() => {
							if (typeof this.props.events === "undefined") {
								console.error("No events provided to SelectableList")
								return false
							}

							if (typeof action.onClick === "function") {
								action.onClick(this.state.selectedKeys)
							}

							if (typeof this.props.events[action.props.call] === "function") {
								this.props.events[action.props.call]({
									onDone: this.onDone,
									onDiscard: this.onDiscard,
									onCancel: this.onCancel,
									selectKey: this.selectKey,
									unselectKey: this.unselectKey,
									selectAll: this.selectAll,
									unselectAll: this.unselectAll,
									isKeySelected: this.isKeySelected,
									isAllSelected: this.isAllSelected,
								}, this.state.selectedKeys)
							}
						}}
					>
						{action}
					</Button>
				</div>
			)
		})
	}

	getLongPressDelay = () => {
		return window.app.settings.get("selection_longPress_timeout")
	}

	renderItems = (data) => {
		return data.length > 0 ? data.map((item, index) => {
			item.key = item.key ?? item.id ?? item._id

			if (item.children && Array.isArray(item.children)) {
				return <div className="selectableList_group">
					<h1>
						{React.isValidElement(item.icon) ? item.icon : Icons[item.icon] && createIconRender(item.icon)}
						<Translation>
							{t => t(item.label)}
						</Translation>
					</h1>

					<div className="selectableList_subItems">
						{this.renderItems(item.children)}
					</div>
				</div>
			}

			let selected = this.isKeySelected(item.key)

			return <ListItem
				item={item}
				selected={selected}
				longPressDelay={this.getLongPressDelay()}

				onClickItem={this.onClickItem}
				onDoubleClickItem={this.onDoubleClickItem}
				onLongPressItem={this.onLongPressItem}

				renderChildren={this.props.renderItem}
				onlyClickSelection={this.props.onlyClickSelection || this.state.selectionEnabled}
			/>
		}) : <antd.Empty image={antd.Empty.PRESENTED_IMAGE_SIMPLE} />
	}

	render() {
		if (!this.props.overrideSelectionEnabled && this.state.selectionEnabled && this.state.selectedKeys.length === 0) {
			this.setState({ selectionEnabled: false })
			this.unselectAll()
		}

		const isAllSelected = this.isAllSelected()
		let items = this.renderItems(this.props.items)

		return <div className={classnames("selectableList", { ["selectionEnabled"]: this.props.overrideSelectionEnabled ?? this.state.selectionEnabled })}>
			<div className="selectableList_content">
				{items}
			</div>
			{this.props.items.length > 0 && (this.props.overrideSelectionEnabled || this.state.selectionEnabled) && !this.props.actionsDisabled &&
				<ActionsBar mode="float">
					<div key="discard">
						<Button
							shape="round"
							onClick={this.onDiscard}
							{...this.props.onDiscardProps}
						>
							{this.props.onDiscardRender ?? <Icons.X />}
							<Translation>
								{(t) => t("Discard")}
							</Translation>
						</Button>
					</div>
					{this.props.bulkSelectionAction &&
						<div key="allSelection">
							<Button
								shape="round"
								onClick={() => isAllSelected ? this.unselectAll() : this.selectAll()}
							>
								<Translation>
									{(t) => t(isAllSelected ? "Unselect all" : "Select all")}
								</Translation>
							</Button>
						</div>}
					{Array.isArray(this.props.actions) && this.renderProvidedActions()}
				</ActionsBar>
			}
		</div>
	}
}