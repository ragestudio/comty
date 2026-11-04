import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Button, Input } from "antd"
import classNames from "clsx"

import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import isUrl from "@utils/isURL"
import createBem from "@/utils/createBem"

import EmojiPicker from "@/components/Expressions/EmojiPicker"
import Popover from "@/ui/Popover"

import styles from "./AddSoundpadItem.module.less"
const b = createBem("soundpad-settings__add", styles)

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
		<div className={classNames(b(), "bg-accent", "border-default")}>
			<div className={b.elem("field")}>
				<h3>
					<Icons.PlusCircle /> Add new sound
				</h3>
				<span
					style={{
						fontSize: 12,
					}}
				>
					(Trims at max 10s)
				</span>
			</div>

			<div className={b.elem("field")}>
				<Popover
					className={b.elem("emoji-select")}
					content={({ close }) => (
						<EmojiPicker
							injectChar={(char) => setIcon(char)}
							close={close}
						/>
					)}
					position="bottom"
				>
					<Button>{icon}</Button>
				</Popover>

				<Input
					placeholder="Sound name"
					maxLength={48}
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</div>

			<div className={b.elem("field")}>
				<UploadButton
					accept="audio/*"
					onSuccess={(uid, response) => {
						setSrc(response.url)
					}}
				>
					Upload
				</UploadButton>

				<span>or</span>

				<Input
					placeholder="HTTPS audio URL"
					value={src}
					onChange={(event) => setSrc(event.target.value)}
				/>
			</div>

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
	)
}

export default AddSoundpadItem
