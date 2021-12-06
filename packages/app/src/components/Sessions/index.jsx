import React from "react"
import * as antd from "antd"
import { Icons } from "components/icons"

import "./index.less"

export default class Sessions extends React.Component {
	renderSessions = () => {
		const data = this.props.sessions

		return data.map((session) => {
			const header = (
				<div className="session_header">
					<div>
						<Icons.Key />
					</div>
					<div>{session._id}</div>
					<div>{this.props.current === session.uuid ? <antd.Tag>Current</antd.Tag> : ""}</div>
				</div>
			)

			const renderDate = () => {
				const dateNumber = Number(session.date)

				if (dateNumber) {
					return new Date(dateNumber).toString()
				}
				return session.date
			}

			return (
				<antd.Collapse.Panel header={header} key={session._id} className="session_entry">
					<div className="session_entry_info">
						{session.allowRegenerate && (
							<div style={{ color: "orange" }}>
								<Icons.AlertTriangle />
								This token can be regenerated
							</div>
						)}
						<div>
							<Icons.Clock />
							{renderDate()}
						</div>
						<div>
							<Icons.Navigation />
							{session.location}
						</div>
						<div>
							<Icons.Map />
							{session.geo}
						</div>
					</div>
				</antd.Collapse.Panel>
			)
		})
	}

	render() {
		if (Array.isArray(this.props.sessions)) {
			return (
				<div className="sessions_wrapper">
					<h1>
						All Sessions
					</h1>
					<antd.Collapse bordered={false} accordion>
						{this.renderSessions()}
					</antd.Collapse>
				</div>
			)
		}

		return <div></div>
	}
}
