import React from "react"
import { Icons, createIconRender } from "components/Icons"
import { SelectableList } from "components"
import { List } from "antd"

import sidebarItems from "schemas/routes.json"

import "./index.less"

const getStoragedKeys = () => {
	return window.app.settings.get("sidebarKeys") ?? []
}

const getAllItems = () => {
	const obj = {}

	sidebarItems.forEach((item) => {
		obj[item.id] = item
	})

	return obj
}

const allItems = getAllItems()

export default class SidebarItemSelector extends React.Component {
	state = {
		items: null,
	}

	componentDidMount = () => {
		const source = (this.props.items ?? getStoragedKeys() ?? []).map((key) => {
			return { key }
		})

		this.setState({ items: source })
	}

	handleDone = (selectedKeys) => {
		if (typeof this.props.onDone === "function") {
			this.props.onDone(selectedKeys)
		}
	}

	render() {
		return (
			<div>
				<h1>
					<Icons.PlusCircle /> Select items to add
				</h1>
				{this.state.items && (
					<SelectableList
						itemLayout="vertical"
						size="large"
						pagination={{
							pageSize: 10,
						}}
						onDone={this.handleDone}
						items={this.state.items ?? []}
						itemClassName="sidebar_selector_item"
						renderItem={(i) => {
							const item = allItems[i.key]

							return (
								<List.Item key={item.title} className="sidebar_selector_item">
									{createIconRender(item.icon)}
									{item.title ?? item.id}
								</List.Item>
							)
						}}
					/>
				)}
			</div>
		)
	}
}
