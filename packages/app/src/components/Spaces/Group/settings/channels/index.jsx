import React from "react"
import { Radio, Input } from "antd"
import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"

import { Icons } from "@components/Icons"
import SortableList from "@components/SortableList"

import GroupsModel from "@models/groups"
import GroupContext from "@contexts/WithSpaces/group"

import "./index.less"

const CHANNEL_TYPES = ["chat", "voice"]

const NewChannelDialog = ({ group_id, onCreated, close }) => {
	const [name, setName] = React.useState("")
	const [type, setType] = React.useState("chat")
	const [loading, setLoading] = React.useState(false)

	const canContinue = () => {
		if (name.trim() === "") return false
		if (!CHANNEL_TYPES.includes(type)) return false

		return true
	}

	const submit = async () => {
		if (!canContinue()) return
		setLoading(true)

		try {
			const newChannel = await GroupsModel.channels.create(group_id, {
				name: name,
				kind: type,
			})

			if (typeof onCreated === "function") {
				await onCreated(newChannel)
			}
		} catch (err) {
		} finally {
			if (typeof close === "function") {
				close()
			}
			setLoading(false)
		}
	}

	if (!group_id) {
		if (typeof close === "function") {
			close()
		}

		return null
	}

	return (
		<div className="new-channel-dialog">
			<h2>Create a new Channel</h2>

			<div className="new-channel-dialog__field">
				<span>Channel name</span>
				<Input
					placeholder="A new channel"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>

			<div className="new-channel-dialog__field">
				<span>Channel Type</span>
				<Radio.Group
					vertical
					options={[
						{
							value: "chat",
							label: "Text",
						},
						{
							value: "voice",
							label: "Voice",
						},
					]}
					value={type}
					onChange={(e) => setType(e.target.value)}
				/>
			</div>

			<div className="new-channel-dialog__actions">
				<Button
					type="primary"
					disabled={!canContinue()}
					onClick={submit}
					loading={loading}
				>
					Create
				</Button>
			</div>
		</div>
	)
}

const Channel = ({ data, onClickDelete }) => {
	const { _id, name, kind, description } = data

	return (
		<div
			id={_id}
			className="group-settings-channels__list__channel"
		>
			<div className="group-settings-channels__list__channel__text">
				<span>
					{kind === "chat" && <Icons.MessageSquare />}
					{kind === "voice" && <Icons.Volume2 />}
					{name}
				</span>
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

	const hasChanges = () => {
		const originalChannelsIds = group.channels.items.map((c) => c._id)
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
		setChannels(group.channels.items)
	}, [])

	return (
		<div className="group-settings-channels__list">
			{hasChanges() ? "changes" : "no changes"}
			<SortableList
				itemIdKey="_id"
				items={group.channels.items}
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
		app.layout.modal.open("new-channel-dialog", NewChannelDialog, {
			props: {
				group_id: group.data._id,
				onCreated: (channel) => {},
			},
		})
	}

	const handleDeleteChannel = async (channel_id) => {
		await GroupsModel.channels.channel.delete(group.data._id, channel_id)
	}

	return (
		<div className="group-settings-channels">
			<div className="group-settings-channels__header">
				<h2>Channels</h2>

				<div className="group-settings-channels__header__actions">
					<Button
						type="default"
						icon={<Icons.PlusCircle />}
						onClick={handleCreateNewChannel}
					>
						Create new
					</Button>
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
