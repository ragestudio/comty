import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import { AppSearcher, ServerStatus, Clock, } from "components"
import { Translation } from "react-i18next"

import "./index.less"

// TODO: Customizable main menu
export default class Main extends React.Component {
	componentDidMount = async () => {
		if (!window.isMobile && window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toggleVisibility(false)
		}
	}

	componentWillUnmount() {
		if (!window.isMobile && !window.app?.HeaderController?.isVisible()) {
			window.app.HeaderController.toggleVisibility(true)
		}
	}

	render() {
		const user = this.props.user ?? {}

		return (
			<div className="dashboard">
				<div className="header">
					<div>
						<antd.Avatar
							shape="square"
							src={user.avatar}
							size={window.isMobile ? undefined : 120}
						/>
					</div>
					<div>
						<div>
							<Clock />
						</div>
						<div>
							<Translation>{
								(t) => <h1>{t("main_welcome")} {user.fullName ?? user.username ?? "Guest"}</h1>
							}</Translation>
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
		)
	}
}