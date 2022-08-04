import React from "react"
import * as antd from "antd"

import { AppSearcher, Clock } from "components"
import { Translation } from "react-i18next"

import "./index.less"

// TODO: Customizable main menu
export default class Main extends React.Component {
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
					</div>
				</div>

				{!window.isMobile && <div>
					<AppSearcher />
				</div>}
			</div>
		)
	}
}