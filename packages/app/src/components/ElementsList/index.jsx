import React from "react"
import * as antd from "antd"
import { RefreshCw } from "feather-reactjs"
import { getCircularReplacer, decycle } from "@corenode/utils"

const serializeFlags = {
	__cycle_flag: true, // with id 0
}

function isFlagId(e, id) {
	return serializeFlags[Object.keys(e)[id ?? 0]]
}

const parseError = (error) => {
	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					padding: "12px 16px",
					height: "47px",
					backgroundColor: "#d9d9d9",
				}}
			>
				This could not be rendered
			</div>
			<div>
				<antd.Collapse>
					<antd.Collapse.Panel header="See error">
						<div style={{ margin: "0 5px 15px 5px", wordBreak: "break-all" }}>
							<span>{error.toString()}</span>
						</div>
					</antd.Collapse.Panel>
				</antd.Collapse>
			</div>
		</div>
	)
}

const parseDecorator = (data, json) => {
	const type = typeof data
	console.log(type)
	switch (type) {
		case "string": {
			return `(${json.length}) characters`
		}
		case "object": {
			if (data == null) {
				return `Empty (null/undefined)`
			}
			if (isFlagId(data, 0)) {
				return (
					<span>
						<RefreshCw /> Cylic
					</span>
				)
			}
			if (typeof data.length !== "undefined") {
				return `Length (${data.length})`
			}
			if (typeof Object.keys(data).length !== "undefined") {
				return `Length (${Object.keys(data).length})`
			}
			return `Immeasurable`
		}
		case "array": {
			return `Length (${data})`
		}
		case "boolean": {
			return <antd.Tag color={data ? "blue" : "volcano"}> {data ? "true" : "false"} </antd.Tag>
		}
		case "number": {
			return <antd.Tag> {data} </antd.Tag>
		}
		default:
			return `Immeasurable / Invalid`
	}
}

const parseData = (data) => {
	try {
		switch (typeof data) {
			case "object": {
				if (data == null) {
					return `${data}`
				}

				if (isFlagId(data, 0)) {
					return (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								padding: "12px 16px",
								height: "47px",
								backgroundColor: "#d9d9d9",
							}}
						>
							<RefreshCw /> Circular
						</div>
					)
				}

				if (Object.keys(data).length > 0) {
					return <div>{ElementList(data)}</div>
				}

				return JSON.stringify(data, getCircularReplacer())
			}
			case "array": {
				return JSON.stringify(data, getCircularReplacer())
			}
			case "boolean": {
				return false
			}
			default:
				return `${data}`
		}
	} catch (error) {
		return parseError(data, error)
	}
}

const parseType = (data) => {
	if (data !== null && isFlagId(data, 0)) {
		return `[loop]`
	}
	return `[${typeof data}]`
}

const excludedTypesFromContent = ["boolean"]

export default function ElementList(data) {
	if (!data) return false

	data = decycle(data)
	const keys = Object.keys(data)

	return keys.map((key) => {
		const value = data[key]
		const content = parseData(value)
		const type = parseType(value)
		const decorator = parseDecorator(value, content)

		const header = (
			<div>
				{type} <strong>{key}</strong> | {decorator}
			</div>
		)

		return (
			<antd.Collapse ghost expandIconPosition="right" bordered="false" style={{ border: "0px" }} key={key}>
				{excludedTypesFromContent.includes(typeof value) ? (
					<antd.Collapse.Panel key={key} header={header} />
				) : (
					<antd.Collapse.Panel key={key} header={header}>
						<div style={{ margin: "0 5px 15px 5px", wordBreak: "break-all" }}>
							<span>{content}</span>
						</div>
					</antd.Collapse.Panel>
				)}
			</antd.Collapse>
		)
	})
}