import React from "react"
import { AppSearcher } from "components"

import "./index.less"

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
				</div>
			</div>
		)
	}
}
