import React from "react"
import { Icons } from "components/Icons"
import { ActionsBar } from "components"
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

		this.setState({
			selectedKeys: [],
		})
	}

	onDiscard = () => {
		if (typeof this.props.onDiscard === "function") {
			this.props.onDiscard(this.state.selectedKeys)
		}

		this.setState({
			selectedKeys: [],
		})
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

	renderActions = () => {
		if (typeof this.props.renderActions !== "undefined" && !this.props.renderActions) {
			return false
		}
		if (this.state.selectedKeys.length === 0) {
			return false
		}

		const renderProvidedActions = () => {
			if (Array.isArray(this.props.actions)) {
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
			return null
		}

		return (
			<div className="bottomActions_wrapper">
				<ActionsBar style={{ borderRadius: "8px 8px 0 0", width: "fit-content" }}>
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
					{renderProvidedActions()}
				</ActionsBar>
			</div>
		)
	}

	render() {
		const validSelectionMethods = ["onClick", "onDoubleClick"]

		const renderMethod = (item) => {
			const selectionMethod = validSelectionMethods.includes(this.props.selectionMethod) ? this.props.selectionMethod : "onClick"

			if (typeof this.props.renderItem === "function") {
				const _key = item.key ?? item.id ?? item._id
				const list = this.state.selectedKeys
				const isSelected = list.includes(_key)

				let props = {
					key: _key,
					id: _key,
					className: classnames("selectableList_item", this.props.itemClassName, {
						selected: this.state.selectedKeys.includes(_key),
					}),
					[selectionMethod]: () => {
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
					props.onClick = () => {
						if (list.length > 0) {
							if (isSelected) {
								this.unselectKey(_key)
							}
						}
					}
				}

				return (
					<div {...props}>
						{this.props.renderItem(item)}
					</div>
				)
			}

			console.warn("renderItem method is not defined!")
			return null
		}

		const { borderer, grid, header, loadMore, locale, pagination, rowKey, size, split, itemLayout, loading } =
			this.props
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

		return (
			<div className={classnames("selectableList", { ["selectionEnabled"]: this.props.selectionEnabled })}>
				<List
					{...listProps}
					dataSource={[
						...(Array.isArray(this.props.items) ? this.props.items : []),
						...(Array.isArray(this.props.children) ? this.props.children : []),
					]}
					renderItem={renderMethod}
				/>
				{this.renderActions()}
			</div>
		)
	}
}