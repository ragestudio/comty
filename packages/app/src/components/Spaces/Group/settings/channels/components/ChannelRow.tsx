import type { Channel } from "@comty/shared/types/spaces/channel"

import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"
import { Icons } from "@components/Icons"

export type ChannelRowProps = {
	channel: Channel
	onEdit: (channel: Channel) => void
	onDelete: (channel: Channel) => void
}

const ChannelRow = ({ channel, onEdit, onDelete }: ChannelRowProps) => {
	return (
		<div
			id={channel._id}
			className="group-settings-channels__list__channel"
		>
			<div className="group-settings-channels__list__channel__text">
				<span>
					{channel.kind === "chat" && <Icons.MessageSquare />}
					{channel.kind === "voice" && <Icons.Volume2 />}
					{channel.name}
				</span>
				<p>{channel.description}</p>
			</div>

			<div className="group-settings-channels__list__channel__actions">
				<Button onClick={() => onEdit(channel)}>Edit</Button>
				<ConfirmButton onConfirm={() => onDelete(channel)}>
					Delete
				</ConfirmButton>
			</div>
		</div>
	)
}

export default ChannelRow
