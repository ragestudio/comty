import React from "react"
import * as antd from "antd"
import { decycle } from "@corenode/utils"
import { Icons } from "components/Icons"

function parseTreeData(data, backKey) {
	const keys = Object.keys(data)
	let result = Array()

	keys.forEach((key) => {
		const value = data[key]
		const valueType = typeof value
		const obj = Object()

		obj.key = backKey ? `${backKey}-${key}` : key
		obj.title = key
		obj.type = valueType

		if (valueType === "object") {
			obj.children = parseTreeData(value)
		} else {
			obj.children = [
				{
					key: `${obj.key}-value`,
					title: "value",
                    icon: <Icons.Box />,
					children: [
						{
							key: `${obj.key}-value-indicator`,
							title: String(value),
                            icon: <Icons.Box />,
						},
					],
				},
				{
					key: `${obj.key}-type`,
					title: "type",
					children: [
						{
							key: `${obj.key}-type-indicator`,
							title: valueType,
						},
					],
				},
			]
		}

		result.push(obj)
	})

	return result
}

export default class ObjectInspector extends React.Component {
	state = {
		data: null,
		expandedKeys: [],
		autoExpandParent: true,
	}

	componentDidMount() {
		const raw = decycle(this.props.data)
		const data = parseTreeData(raw)

		this.setState({ raw, data })
	}

	onExpand = (expandedKeys) => {
		this.setState({
			expandedKeys,
			autoExpandParent: false,
		})
	}

	render() {
		const { expandedKeys, autoExpandParent } = this.state
		return (
			<div>
				<antd.Tree
					//showLine
				
                    switcherIcon={<Icons.DownOutlined />}
					onExpand={this.onExpand}
					expandedKeys={expandedKeys}
					autoExpandParent={autoExpandParent}
					treeData={this.state.data}
				/>
			</div>
		)
	}
}
