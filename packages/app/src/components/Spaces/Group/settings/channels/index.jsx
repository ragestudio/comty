import React from "react"
import Button from "@ui/Button"
import { Icons } from "@components/Icons"
import ConfirmButton from "@ui/ConfirmButton"
import SortableList from "@components/SortableList"

import GroupsModel from "@models/groups"
import GroupContext from "@contexts/WithSpaces/group"

import "./index.less"

const Channel = ({ data, onClickDelete }) => {
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
				<ConfirmButton onConfirm={onClickDelete}>Delete</ConfirmButton>
			</div>
		</div>
	)
}

const ChannelsList = ({ onDeleteChannel }) => {
	const group = React.useContext(GroupContext)
	const [channels, setChannels] = React.useState([])

	const [L_Channels, R_Channels, E_Channels] = app.cores.api.useRequest(
		GroupsModel.channels.list,
		group?.data?._id,
	)

	const hasChanges = () => {
		const originalChannelsIds = R_Channels.items.map((c) => c._id)
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
			group?.data?._id,
			arr.map((c) => c._id),
		)
	}

	React.useEffect(() => {
		if (R_Channels) {
			setChannels(R_Channels.items)
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
						onClickDelete={() => onDeleteChannel(channel._id)}
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
	const group = React.useContext(GroupContext)

	const handleCreateNewChannel = async () => {
		await GroupsModel.channels.create(group.data._id, {
			name: "New channel",
			kind: "chat",
		})
	}

	const handleDeleteChannel = async (channel_id) => {
		await GroupsModel.channels.channel.delete(group.data._id, channel_id)
	}

	return (
		<div className="group-settings-channels">
			<div className="group-settings-channels__header">
				<h3>Channels</h3>

				<div className="group-settings-channels__header__actions">
					<Button onClick={handleCreateNewChannel}>Create new</Button>
				</div>
			</div>

			<ChannelsList onDeleteChannel={handleDeleteChannel} />
		</div>
	)
}

export default {
	key: "channels",
	label: "Channels",
	icon: Icons.LayoutList,
	render: ChannelsSettings,
}
