import type { Channel } from "@comty/shared/types/spaces/channel"

import React from "react"
import { Input, InputNumber, Modal } from "antd"

export type ChannelEditModalProps = {
	channel: Channel | null
	onClose: () => void
	onSave: (
		channelId: string,
		payload: {
			name: string
			description: string
			params?: Record<string, string>
		},
	) => Promise<void>
}

const ChannelEditModal = ({
	channel,
	onClose,
	onSave,
}: ChannelEditModalProps) => {
	const [name, setName] = React.useState("")
	const [description, setDescription] = React.useState("")
	const [userLimit, setUserLimit] = React.useState(0)
	const [loading, setLoading] = React.useState(false)

	React.useEffect(() => {
		if (!channel) return

		setName(channel.name ?? "")
		setDescription(channel.description ?? "")
		setUserLimit(Number.parseInt(channel.params?.user_limit ?? "0", 10) || 0)
	}, [channel])

	const submit = async () => {
		if (!channel) return

		setLoading(true)

		try {
			await onSave(channel._id, {
				name: name.trim(),
				description: description.trim(),
				...(channel.kind === "voice"
					? {
							params: {
								user_limit: String(userLimit ?? 0),
							},
						}
					: {}),
			})

			onClose()
		} catch {
			// the error is already reported by the channels hook
		} finally {
			setLoading(false)
		}
	}

	return (
		<Modal
			open={Boolean(channel)}
			title="Edit channel"
			okText="Save"
			okButtonProps={{
				loading,
				disabled: name.trim().length < 3,
			}}
			onOk={submit}
			onCancel={onClose}
		>
			<div className="group-settings-channels__edit">
				<div className="group-settings-channels__edit__field">
					<span>Name</span>
					<Input
						value={name}
						maxLength={64}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div className="group-settings-channels__edit__field">
					<span>Description</span>
					<Input.TextArea
						value={description}
						maxLength={500}
						rows={3}
						onChange={(event) => setDescription(event.target.value)}
					/>
				</div>

				{channel?.kind === "voice" && (
					<div className="group-settings-channels__edit__field">
						<span>User limit (0 = unlimited)</span>
						<InputNumber
							min={0}
							max={99}
							value={userLimit}
							onChange={(value) => setUserLimit(value ?? 0)}
						/>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default ChannelEditModal
