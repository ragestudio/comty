import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Button, Input } from "antd"

import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import isUrl from "@utils/isURL"

export type AddSoundpadItemProps = {
	onSubmit: (
		payload: Pick<SoundpadItemPayload, "icon" | "name" | "src">,
	) => Promise<void>
}

const AddSoundpadItem = ({ onSubmit }: AddSoundpadItemProps) => {
	const [icon, setIcon] = React.useState("🔊")
	const [name, setName] = React.useState("")
	const [src, setSrc] = React.useState("")
	const [submitting, setSubmitting] = React.useState(false)

	const canSubmit =
		icon.trim().length > 0 &&
		name.trim().length > 0 &&
		src.trim().length > 0 &&
		isUrl(src) &&
		src.startsWith("https://")

	const submit = async () => {
		if (!canSubmit) return

		setSubmitting(true)

		try {
			await onSubmit({
				icon: icon.trim(),
				name: name.trim(),
				src: src.trim(),
			})

			setName("")
			setSrc("")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="soundpad-settings__add">
			<div className="soundpad-settings__add__fields">
				<Input
					placeholder="Icon"
					maxLength={16}
					value={icon}
					style={{ width: 70 }}
					onChange={(event) => setIcon(event.target.value)}
				/>

				<Input
					placeholder="Sound name"
					maxLength={48}
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>

				<Input
					placeholder="HTTPS audio URL"
					value={src}
					onChange={(event) => setSrc(event.target.value)}
				/>

				<UploadButton
					accept="audio/*"
					onSuccess={(uid, response) => {
						setSrc(response.url)
					}}
				>
					<Icons.Upload /> Upload
				</UploadButton>

				<Button
					type="primary"
					icon={<Icons.Plus />}
					disabled={!canSubmit || submitting}
					loading={submitting}
					onClick={submit}
				>
					Add
				</Button>
			</div>
		</div>
	)
}

export default AddSoundpadItem
