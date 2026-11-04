import type { Channel } from "@comty/shared/types/spaces/channel"

import React from "react"
import { Skeleton } from "antd"

import Button from "@ui/Button"
import { Icons } from "@components/Icons"
import SortableList from "@components/SortableList"
import { useGroupData, useGroupLoading } from "@comty/spaces-sdk/group"

import ChannelEditModal from "./components/ChannelEditModal"
import ChannelRow from "./components/ChannelRow"
import NewChannelDialog from "./components/NewChannelDialog"
import { useChannels } from "./useChannels"

import "./index.less"

const ChannelsSettings = () => {
	const data = useGroupData()
	const loading = useGroupLoading()

	const { channels, create, update, remove, order } = useChannels(data?._id)

	const [editingChannel, setEditingChannel] = React.useState<Channel | null>(
		null,
	)

	const handleCreateNewChannel = () => {
		app.layout.modal.open("new-channel-dialog", NewChannelDialog, {
			props: {
				onCreate: create,
				close: () => app.layout.modal.close("new-channel-dialog"),
			},
		})
	}

	const handleDeleteChannel = async (channel: Channel) => {
		await remove(channel._id)
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

			<div className="group-settings-channels__list">
				{loading && <Skeleton active />}

				{!loading && (
					<SortableList
						itemIdKey="_id"
						items={channels?.items ?? []}
						renderItem={(channel: Channel) => (
							<ChannelRow
								key={channel._id}
								channel={channel}
								onEdit={setEditingChannel}
								onDelete={handleDeleteChannel}
							/>
						)}
						onChange={order}
					/>
				)}
			</div>

			<ChannelEditModal
				channel={editingChannel}
				onClose={() => setEditingChannel(null)}
				onSave={update}
			/>
		</div>
	)
}

export default {
	key: "channels",
	label: "Channels",
	icon: Icons.LayoutList,
	permission: "MANAGE_CHANNELS",
	render: ChannelsSettings,
}
