import React from "react"
import { Input, Radio } from "antd"

import Button from "@ui/Button"

export type NewChannelDialogProps = {
	onCreate: (payload: { name: string; kind: "chat" | "voice" }) => Promise<any>
	close: () => void
}

const CHANNEL_TYPES = ["chat", "voice"]

const NewChannelDialog = ({ onCreate, close }: NewChannelDialogProps) => {
	const [name, setName] = React.useState("")
	const [type, setType] = React.useState<"chat" | "voice">("chat")
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
			await onCreate({ name: name.trim(), kind: type })
		} catch {
			// the error is already reported by the channels hook
		} finally {
			close()
			setLoading(false)
		}
	}

	return (
		<div className="new-channel-dialog">
			<h2>Create a new Channel</h2>

			<div className="new-channel-dialog__field">
				<span>Channel name</span>
				<Input
					placeholder="A new channel"
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</div>

			<div className="new-channel-dialog__field">
				<span>Channel Type</span>
				<Radio.Group
					vertical
					options={[
						{ value: "chat", label: "Text" },
						{ value: "voice", label: "Voice" },
					]}
					value={type}
					onChange={(event) => setType(event.target.value)}
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

export default NewChannelDialog
