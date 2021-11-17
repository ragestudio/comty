import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { Sessions } from "components"

export default class SessionsView extends React.Component {
	signOutAll = () => {
		antd.Modal.warning({
			title: "Caution",
			content: "This action will cause all sessions to be closed, you will have to log in again.",
			onOk: () => {
				//this.setState({ sessions: null })
				window.app.eventBus.emit("destroyAllSessions")
			},
			okCancel: true,
		})
	}

	render() {
		const { sessions, decodedToken } = this.props

		if (!sessions) {
			return <antd.Skeleton active />
		}

		return (
			<div className="session_wrapper">
				<Sessions current={decodedToken?.uuid} sessions={this.props.sessions} />
				{sessions && (
					<antd.Button onClick={this.signOutAll} type="danger">
						Destroy all sessions
					</antd.Button>
				)}
			</div>
		)
	}
}