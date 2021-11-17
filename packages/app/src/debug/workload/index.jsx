import React from "react"
import RJson from "react-json-view"

import "./index.less"

export default class WorkloadDebugger extends React.Component {
    binding = window.app.debug.bindings["workload_list"]

    addTestWorkload = () => {
		this.binding.addWorkload({
			_id: "test",
			name: "Test Workload",
			status: "funny",
		})
        this.forceUpdate()
	}

	removeTestWorkload = () => {
		this.binding.deleteWorkload("test")
        this.forceUpdate()
	}

	render() {
        this.binding = window.app.debug.bindings["workload_list"]

		if (!this.binding) {
			return (
				<div>
					<h2>Workload binding not available</h2>

					<button onClick={() => this.forceUpdate()}>reload</button>
				</div>
			)
		}

		return (
			<div className="wrapper">
				<div key="statement" className="section">
					<h4>State</h4>
					<div>
						<RJson name="state.workloads" collapsed="true" src={this.binding.state.workloads} />
					</div>
				</div>
				<div key="test_item" className="section">
					<h4>Test item</h4>
					<div>
						<button onClick={() => this.addTestWorkload()}>Add</button>
						<button onClick={() => this.removeTestWorkload()}>Delete All</button>
					</div>
				</div>
			</div>
		)
	}
}
