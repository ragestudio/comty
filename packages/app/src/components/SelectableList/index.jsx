import React from "react"
import { Icons } from "components/Icons"
import { List, Button } from "antd"
import classnames from "classnames"

import "./index.less"

export default class SelectableList extends React.Component {
	state = {
		selectedKeys: [],
	}

	componentDidMount() {
		if (typeof this.props.defaultSelected !== "undefined" && Array.isArray(this.props.defaultSelected)) {
			this.setState({
				selectedKeys: [...this.props.defaultSelected],
			})
		}
	}

	selectAll = () => {
		if (this.props.items.length > 0) {
			this.setState({
				selectedKeys: [...this.props.items.map((item) => item.key ?? item.id ?? item._id)],
			})
		}
	}

	unselectAll = () => {
		this.setState({
			selectedKeys: [],
		})
	}

	selectKey = (key) => {
		let list = this.state.selectedKeys ?? []
		list.push(key)
		return this.setState({ selectedKeys: list })
	}

	unselectKey = (key) => {
		let list = this.state.selectedKeys ?? []
		list = list.filter((_key) => key !== _key)
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

	componentDidUpdate(prevProps, prevState) {
		if (typeof this.props.selectionEnabled !== "undefined") {
			if (!Boolean(this.props.selectionEnabled) && this.state.selectedKeys.length > 0) {
				this.setState({
					selectedKeys: [],
				})
			}
		}
	}

	renderProvidedActions = () => {
		return this.props.actions.map((action) => {
			return (
				<div key={action.key}>
					<Button
						style={{
							...action.props.style,
						}}
						onClick={() => {
							if (typeof action.onClick === "function") {
								action.onClick(this.state.selectedKeys)
							}

							if (typeof this.props[action.props.call] !== "undefined") {
								if (typeof this.props[action.props.call] === "function") {
									let data = this.state.selectedKeys // by default send selectedKeys

									if (typeof action.props.sendData === "string") {
										switch (action.props.sendData) {
											case "keys": {
												data = this.state.selectedKeys
											}
											default: {
												data = this.state.selectedKeys
											}
										}
									}

									this.props[action.props.call](data)
								}
							}
						}}
					>
						{action}
					</Button>
				</div>
			)
		})
	}

	renderActions = () => {
		if (this.props.actionsDisabled) {
			return null
		}

		return <div className={classnames("selectableList_bottomActions", { ["mobile"]: window.isMobile && !this.props.ignoreMobileActions })}>
			<div key="discard">
				<Button
					shape="round"
					onClick={this.onDiscard}
					{...this.props.onDiscardProps}
				>
					{this.props.onDiscardRender ?? <Icons.X />}
					Discard
				</Button>
			</div>
			{Array.isArray(this.props.actions) && this.renderProvidedActions()}
		</div>
	}

	isKeySelected = (key) => {
		return this.state.selectedKeys.includes(key)
	}

	renderItem = (item) => {
		if (item.children) {
			return <div className="selectableList_group">
				{item.label}
				<div className="selectableList_subItems">
					{item.children.map((subItem) => {
						return this.renderItem(subItem)
					})}
				</div>
			</div>
		}

		const renderChildren = this.props.renderItem(item)

		const _key = item.key ?? item.id ?? item._id ?? renderChildren.key

		const selectionMethod = ["onClick", "onDoubleClick"].includes(this.props.selectionMethod) ? this.props.selectionMethod : "onClick"
		const isSelected = this.isKeySelected(_key)
		const isDisabled = renderChildren.props.disabled
		const isNotSelectable = renderChildren.props.notSelectable

		let renderProps = {
			disabled: isDisabled,
			children: renderChildren,
			className: classnames("selectableList_item", {
				["selected"]: isSelected && !isNotSelectable,
				["disabled"]: isDisabled && !isNotSelectable,
			}),
			[selectionMethod]: () => {
				if (isDisabled && isNotSelectable) {
					return false
				}
				if (typeof this.props.selectionEnabled !== "undefined") {
					if (!Boolean(this.props.selectionEnabled)) {
						return false
					}
				}

				if (isSelected) {
					this.unselectKey(_key)
				} else {
					this.selectKey(_key)
				}
			}
		}

		if (selectionMethod == "onDoubleClick") {
			renderProps.onClick = () => {
				if (this.state.selectedKeys.length > 0) {
					if (isSelected) {
						this.unselectKey(_key)
					}
				}
			}
		}

		return <div key={_key} {...renderProps} />
	}

	render() {
		const { borderer, grid, header, loadMore, locale, pagination, rowKey, size, split, itemLayout, loading } = this.props
		const listProps = {
			borderer,
			grid,
			header,
			loadMore,
			locale,
			pagination,
			rowKey,
			size,
			split,
			itemLayout,
			loading,
		}

		if (this.state.selectedKeys.length === 0) {
			if (window.isMobile && !this.props.ignoreMobileActions) {
				window.app.BottomBarController.clear()
			}
		} else {
			if (window.isMobile && !this.props.ignoreMobileActions) {
				window.app.BottomBarController.render(this.renderActions())
			}
		}

		return <div className={classnames("selectableList", { ["selectionEnabled"]: this.props.selectionEnabled })}>
			<List
				{...listProps}
				dataSource={this.props.items}
				renderItem={this.renderItem}
			/>
			<div className="selectableList_bottomActions_wrapper">
				{this.props.ignoreMobileActions && this.renderActions()}
			</div>
		</div>
	}
}