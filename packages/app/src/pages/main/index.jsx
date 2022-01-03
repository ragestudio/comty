import React from "react"
import * as antd from "antd"
import { AppSearcher, ServerStatus, Clock } from "components"

import "./index.less"

// TODO: Customizable main menu
export default class Main extends React.Component {
	api = window.app.request

	componentDidMount() {
		if (!window.isMobile && window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toogleVisible(false)
		}
	}

	componentWillUnmount() {
		if (!window.isMobile && !window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toogleVisible(true)
		}
	}

	render() {
		const user = this.props.user ?? {}

		return (
			<div className="dashboard">
				<div className="top">
					<div className="header_title">
						<div>
							<antd.Avatar shape="square" src={user.avatar} size={window.isMobile ? undefined : 120} />
						</div>
						<div>
							<div>
								<Clock />
							</div>
							<div>
								<h1>Welcome back, {user.fullName ?? user.username ?? "Guest"}</h1>
							</div>
							{!window.isMobile && <div>
								<ServerStatus />
							</div>}
						</div>
					</div>
					{!window.isMobile && <div>
						<AppSearcher />
					</div>}
				</div>
			</div>
		)
	}
}