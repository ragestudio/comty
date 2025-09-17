import React from "react"
import { Button, Result, Input } from "antd"

import GroupsModel from "@models/groups"

import "./index.less"

const CreateGroup = (props) => {
	const [name, setName] = React.useState("")
	const [description, setDescription] = React.useState("")

	const createGroup = async () => {
		const result = await GroupsModel.create({
			name,
			description,
		}).catch((error) => {
			console.error(error)

			app.cores.notifications.new({
				type: "error",
				title: "Failed to create group",
				description: error.message,
			})
			return null
		})

		if (result) {
			app.message.info("Group created")
			props.close()
		}
	}

	return (
		<div className="create-group-dialog">
			<h1>Create Group</h1>

			<Input
				placeholder="Group name"
				value={name}
				onChange={(i) => setName(i.target.value)}
			/>
			<Input
				placeholder="Group description"
				value={description}
				onChange={(i) => setDescription(i.target.value)}
			/>

			<div className="create-group-dialog__actions">
				<Button onClick={props.close}>Cancel</Button>
				<Button
					type="primary"
					onClick={createGroup}
				>
					Create
				</Button>
			</div>
		</div>
	)
}

const GroupListItem = ({ group }) => {
	const onClick = () => {
		app.location.push(`/spaces/${group._id}`)
	}

	return (
		<div
			className="groups-page__group-item"
			onClick={onClick}
		>
			<div className="groups-page__group-item__icon">
				<img src={group.icon} />
			</div>

			<div className="groups-page__group-item__content">
				<h1>{group.name}</h1>
				<p>{group.description}</p>
			</div>

			<div className="groups-page__group-item__extra"></div>
		</div>
	)
}

const GroupsPage = (props) => {
	const [L_Groups, R_Groups, E_Groups] = app.cores.api.useRequest(
		GroupsModel.getMy,
	)

	const showCreateGroupDialog = React.useCallback(() => {
		app.layout.modal.open("create-group-dialog", CreateGroup)
	}, [])

	if (E_Groups) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load groups"
			/>
		)
	}

	if (L_Groups) {
		return <div className="groups-page">Loading...</div>
	}

	return (
		<div className="groups-page">
			<div className="groups-page__header">
				<Button onClick={showCreateGroupDialog}>Create new</Button>
			</div>

			<div className="groups-page__groups_list">
				{R_Groups.items.length === 0 && (
					<Result
						status="info"
						title="No groups"
						subTitle="You have no groups yet"
					/>
				)}
				{R_Groups.items.map((group) => (
					<GroupListItem
						key={group._id}
						group={group}
					/>
				))}
			</div>
		</div>
	)
}

export default GroupsPage
