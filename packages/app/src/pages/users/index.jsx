import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { ActionsBar, SelectableList } from "components"

import "./index.less"

export default class Users extends React.Component {
	state = {
		data: null,
		selectionEnabled: false,
	}

	api = window.app.request

	componentDidMount = async () => {
		await this.loadData()
	}

	loadData = async () => {
		this.setState({ data: null })
		const data = await this.api.get.users()
		this.setState({ data })
	}

	toogleSelection = (to) => {
		this.setState({ selectionEnabled: to ?? !this.state.selectionEnabled })
	}

	openUser(username) {
		if (this.state.selectionEnabled) {
			return false
		}

		window.app.setLocation(`/account`, { username })
	}

	renderRoles(roles) {
		return roles.map((role) => {
			return <antd.Tag key={role}> {role} </antd.Tag>
		})
	}

	renderItem = (item) => {
		return (
			<div
				key={item._id}
				onDoubleClick={() => this.openUser(item.username)}
				className="user_item"
			>
				<div>
					<antd.Avatar shape="square" src={item.avatar} />
				</div>
				<div className="title">
					<div className="line">
						<div>
							<h1>{item.fullName ?? item.username}</h1>
						</div>
						<div>
							<h3>#{item._id}</h3>
						</div>
					</div>
					<div>{this.renderRoles(item.roles)}</div>
				</div>
			</div>
		)
	}

	render() {
		return (
			<div>
				<div className="users_list">
					<ActionsBar mode="float">
						<div>
							<antd.Button shape="round" icon={this.state.selectionEnabled ? <Icons.Check /> : <Icons.MousePointer />} type={this.state.selectionEnabled ? "default" : "primary"} onClick={() => this.toogleSelection()}>
								{this.state.selectionEnabled ? "Done" : "Select"}
							</antd.Button>
						</div>
						<div>
							<antd.Button type="primary" icon={<Icons.Plus />}>New User</antd.Button>
						</div>
					</ActionsBar>
					{!this.state.data ? <antd.Skeleton active /> :
						<SelectableList
							selectionEnabled={this.state.selectionEnabled}
							items={this.state.data}
							renderItem={this.renderItem}
						/>}
				</div>
			</div>
		)
	}
}
