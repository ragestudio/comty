import React from "react"
import * as antd from "antd"
import { Skeleton } from "components"
import { Icons } from "components/Icons"
import { Session } from "models"

import "./index.less"

const SessionsList = (props) => {
	const sessions = props.sessions.map((session) => {
		const header = (
			<div className="session_header">
				<div>
					<Icons.Key />
				</div>
				<div>{session.session_uuid}</div>
				<div>{props.current === session.session_uuid ? <antd.Tag>Current</antd.Tag> : ""}</div>
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
			<antd.Collapse.Panel header={header} key={session.session_uuid} className="session_entry">
				<div className="session_entry_info">
					<div>
						<Icons.Clock />
						{renderDate()}
					</div>
					<div>
						<Icons.Navigation />
						{session.location}
					</div>
				</div>
			</antd.Collapse.Panel>
		)
	})

	if (!props.sessions || !Array.isArray(props.sessions)) {
		return <div>
			<antd.Empty>
				Cannot find any valid sessions
			</antd.Empty>
		</div>
	}

	return <div className="sessions_wrapper">
		<antd.Collapse bordered={false} accordion>
			{sessions}
		</antd.Collapse>
	</div>
}

export default class SessionsView extends React.Component {
	state = {
		currentSessionUUID: null,
	}

	componentDidMount = async () => {
		const currentSession = await Session.decodedToken()
		this.setState({ currentSessionUUID: currentSession?.session_uuid })
	}

	signOutAll = () => {
		antd.Modal.warning({
			title: "Caution",
			content: "This action will cause all sessions to be closed, you will have to log in again.",
			onOk: () => {
				if (typeof this.props.handleSignOutAll === "function") {
					this.props.handleSignOutAll()
				} else {
					antd.message.error("Sign out all sessions failed")
					console.error("handleSignOutAll is not a function")
				}
			},
			okCancel: true,
		})
	}

	render() {
		const { sessions } = this.props

		if (!sessions) {
			return <Skeleton />
		}

		return (
			<div className="sessions_wrapper">
				<div className="header">
					<div>
						<h1><Icons.Key /> All Sessions</h1>
					</div>
					<div>
						{sessions && (
							<antd.Button onClick={this.signOutAll} type="danger">
								Destroy all sessions
							</antd.Button>
						)}
					</div>
				</div>
				<div>
					<SessionsList current={this.state.currentSessionUUID} sessions={this.props.sessions} />
				</div>
			</div>
		)
	}
}