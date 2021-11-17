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

	onClickKey = (key) => {
		if (typeof this.props.selectionEnabled !== "undefined") {
			if (!Boolean(this.props.selectionEnabled)) {
				return false
			}
		}

		let list = this.state.selectedKeys ?? []

		if (!list.includes(key)) {
			list.push(key)
		} else {
			list = list.filter((_key) => key !== _key)
		}

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

	renderActions = () => {
		if (typeof this.props.renderActions !== "undefined" && !this.props.renderActions) {
			return false
		}
		if (this.state.selectedKeys.length === 0) {
			return false
		}

		const renderExtraActions = () => {
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
							style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
							shape="circle"
							onClick={this.onDiscard}
							{...this.props.onDiscardProps}
						>
							{this.props.onDiscardRender ?? <Icons.X style={{ margin: 0, padding: 0 }} />}
						</Button>
					</div>
					<div key="done">
						<Button type="primary" onClick={this.onDone} {...this.props.onDoneProps}>
							{this.props.onDoneRender ?? (
								<>
									<Icons.Check /> Done
								</>
							)}
						</Button>
					</div>

					{renderExtraActions()}
				</ActionsBar>
			</div>
		)
	}

	render() {
		const renderMethod = (item) => {
			if (typeof this.props.renderItem === "function") {
				const _key = item.key ?? item.id ?? item._id

				return (
					<div
						key={_key}
						id={_key}
						onClick={() => this.onClickKey(_key)}
						className={classnames("selectableList_item", this.props.itemClassName, {
							selection: this.state.selectionEnabled,
							selected: this.state.selectedKeys.includes(_key),
						})}
					>
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
			<div>
				{this.renderActions()}
				<List
					{...listProps}
					dataSource={[
						...(Array.isArray(this.props.items) ? this.props.items : []),
						...(Array.isArray(this.props.children) ? this.props.children : []),
					]}
					renderItem={renderMethod}
				/>
			</div>
		)
	}
}
