import React from "react"
import * as antd from "antd"
import { AppSearcher } from "components"
import * as charts from "react-chartjs-2"

import "./index.less"

const data = {
	labels: ["Red", "Orange", "Blue"],
	datasets: [
		{
			label: "Popularity of colours",
			data: [55, 23, 96],
			borderWidth: 5,
			fill: false,
		},
	],
}

const chartKeys = Object.fromEntries(Object.keys(charts).map((key) => {
	return [String(key).toLowerCase(), key]
}))

class ChartGenerator extends React.Component {
	constructor(payload) {
		super(payload)
		this.payload = payload

		this.type = this.payload.type
		this.Chart = charts[this.type] ?? charts[chartKeys[this.type]]

		this.state = {
			labels: [],
			datasets: [],
		}

		if (!this.Chart) {
			console.error("Chart type is not valid")
		}
	}

	render() {
		const { Chart } = this

		if (React.isValidElement(Chart)) {
			return null
		}

		return <Chart data={this.state} />
	}
}

export default class Main extends React.Component {
	componentWillUnmount() {
		if (!window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toogleVisible(true)
		}
	}
	
	componentDidMount() {
		if (window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toogleVisible(false)
		}
	}

	render() {
		const user = this.props.user ?? {}

		return (
			<div className="dashboard">
				<div className="top">
					<div>
						<h1>Welcome back, {user.fullName ?? user.username ?? "Guest"}</h1>
					</div>
					<div>
						<AppSearcher />
					</div>
				</div>
				<div className="content">
					<h2>Statistics</h2>
					<div><ChartGenerator type="line" /></div>
				</div>
			</div>
		)
	}
}
