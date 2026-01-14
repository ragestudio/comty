import React from "react"
import { Button } from "antd"
import { Icons } from "@components/Icons"

import SortableList from "@components/SortableList"

import GroupsModel from "@models/groups"
import GroupContext from "@pages/spaces/contexts/group"

import "./index.less"

const Channel = ({ data }) => {
	const { _id, name, description } = data

	return (
		<div
			id={_id}
			className="group-settings-channels__list__channel"
		>
			<div className="group-settings-channels__list__channel__text">
				<span>{name}</span>
				<p>{description}</p>
			</div>

			<div className="group-settings-channels__list__channel__actions">
				<Button>Edit</Button>
			</div>
		</div>
	)
}

const ChannelsList = () => {
	const group = React.useContext(GroupContext)
	const [channels, setChannels] = React.useState([])

	const [L_Channels, R_Channels, E_Channels] = app.cores.api.useRequest(
		GroupsModel.channels.list,
		group._id,
	)

	const hasChanges = () => {
		const originalChannelsIds = R_Channels.map((c) => c._id)
		const channelsIds = channels.map((c) => c._id)

		// check if the channels orders are different
		if (channelsIds.length !== originalChannelsIds.length) {
			return true
		}

		for (let i = 0; i < channelsIds.length; i++) {
			if (channelsIds[i] !== originalChannelsIds[i]) {
				return true
			}
		}

		return false
	}

	const onOrderChange = async (arr) => {
		setChannels(arr)

		await GroupsModel.channels.order(
			group._id,
			arr.map((c) => c._id),
		)
	}

	React.useEffect(() => {
		if (R_Channels) {
			setChannels(R_Channels)
		}
	}, [R_Channels])

	if (E_Channels) {
		return <div>Error</div>
	}

	if (L_Channels) {
		return <div>Loading</div>
	}

	return (
		<div className="group-settings-channels__list">
			{hasChanges() ? "changes" : "no changes"}
			<SortableList
				itemIdKey="_id"
				items={channels}
				renderItem={(channel) => (
					<Channel
						key={channel._id}
						data={channel}
					/>
				)}
				onChange={(arr) => {
					onOrderChange(arr)
				}}
			/>
		</div>
	)
}

const ChannelsSettings = () => {
	return (
		<div className="group-settings-channels">
			<div className="group-settings-channels__header">
				<h3>Channels</h3>

				<div className="group-settings-channels__header__actions">
					<Button>Create new</Button>
				</div>
			</div>

			<ChannelsList />
		</div>
	)
}

export default {
	key: "channels",
	label: "Channels",
	icon: Icons.LayoutList,
	render: ChannelsSettings,
}
