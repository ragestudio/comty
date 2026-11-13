import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import {
	SOUNDPAD_MAX_DURATION_SECONDS,
	SOUNDPAD_NAME_MAX_LENGTH,
} from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Button, Input } from "antd"
import classNames from "clsx"

import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"
import UploadFileUrl from "@components/UploadFileUrl"

import isUrl from "@utils/isURL"
import getErrorMessage from "@utils/getErrorMessage"
import createBem from "@/utils/createBem"

import EmojiPicker from "@/components/Expressions/EmojiPicker"
import Popover from "@/ui/Popover"

import { getAudioDuration } from "./audio"

import styles from "./AddSoundpadItem.module.less"

const b = createBem("soundpad-settings__add", styles)

export type AddSoundpadItemProps = {
	onSubmit: (
		payload: Pick<SoundpadItemPayload, "icon" | "name" | "src">,
	) => Promise<boolean | void>
	maxReached?: boolean
}

const AddSoundpadItem = ({
	onSubmit,
	maxReached = false,
}: AddSoundpadItemProps) => {
	const [icon, setIcon] = React.useState("🔊")
	const [name, setName] = React.useState("")
	const [src, setSrc] = React.useState("")
	const [submitting, setSubmitting] = React.useState(false)

	const canSubmit =
		!maxReached &&
		icon.trim().length > 0 &&
		name.trim().length > 0 &&
		src.trim().length > 0 &&
		isUrl(src) &&
		src.startsWith("https://")

	const submit = async () => {
		if (!canSubmit || submitting) return

		setSubmitting(true)

		try {
			const duration = await getAudioDuration(src.trim())

			if (duration > SOUNDPAD_MAX_DURATION_SECONDS) {
				app.message.error(
					`Sound must be ${SOUNDPAD_MAX_DURATION_SECONDS} seconds or shorter`,
				)

				return
			}

			const added = await onSubmit({
				icon: icon.trim(),
				name: name.trim(),
				src: src.trim(),
			})

			if (added === false) return

			setName("")
			setSrc("")
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to add sound"))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className={classNames(b(), "bg-accent", "border-default")}>
			<div className={b.elem("header")}>
				<h3>
					<Icons.PlusCircle /> Add new sound
				</h3>
				<span>Max {SOUNDPAD_MAX_DURATION_SECONDS} seconds</span>
			</div>

			<div className={b.elem("row")}>
				<Popover
					className={b.elem("emoji-select")}
					portal
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
					maxLength={SOUNDPAD_NAME_MAX_LENGTH}
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>

				<UploadFileUrl
					accept="audio/*"
					onChange={(value) => {
						setSrc(value)
					}}
				/>
			</div>

			<div className={b.elem("footer")}>
				<Button
					type="primary"
					icon={<Icons.Plus />}
					disabled={!canSubmit || submitting}
					loading={submitting}
					onClick={submit}
				>
					Add
				</Button>

				{maxReached && (
					<span className={b.elem("hint")}>
						You reached the sounds limit
					</span>
				)}
			</div>
		</div>
	)
}

export default AddSoundpadItem
