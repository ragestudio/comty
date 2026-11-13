import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import {
	SOUNDPAD_MAX_DURATION_SECONDS,
	SOUNDPAD_NAME_MAX_LENGTH,
} from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Button, Input, Upload } from "antd"
import classNames from "clsx"

import { Icons } from "@components/Icons"
import UploadFileUrl from "@components/UploadFileUrl"

import isUrl from "@utils/isURL"
import getErrorMessage from "@utils/getErrorMessage"
import createBem from "@/utils/createBem"

import EmojiPicker from "@/components/Expressions/EmojiPicker"
import Popover from "@/ui/Popover"

import { openAudioClipEditor } from "@components/AudioClipEditor"
import { getAudioDuration, uploadAudioFile } from "./audio"

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

	const submitSource = async (source: string) => {
		const value = source.trim()

		if (!value) return false

		const added = await onSubmit({
			icon: icon.trim(),
			name: name.trim(),
			src: value,
		})

		if (added === false) return false

		setName("")
		setSrc("")

		return true
	}

	const handleEditorSaved = async (url: string) => {
		setSrc(url)

		if (!icon.trim() || !name.trim()) return

		setSubmitting(true)

		try {
			await submitSource(url)
		} finally {
			setSubmitting(false)
		}
	}

	const launchEditor = (source: File | string) => {
		openAudioClipEditor({
			source,
			title: "Adjust sound clip",
			maxDuration: SOUNDPAD_MAX_DURATION_SECONDS,
			onSave: async (file) => {
				const url = await uploadAudioFile(file)

				await handleEditorSaved(url)
			},
		})
	}

	const submit = async () => {
		if (!canSubmit || submitting) return

		const value = src.trim()

		setSubmitting(true)

		try {
			const duration = await getAudioDuration(value)

			if (duration > SOUNDPAD_MAX_DURATION_SECONDS) {
				launchEditor(value)
				return
			}

			await submitSource(value)
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
					value={src}
					onChange={(value) => {
						setSrc(value)
					}}
					beforeUpload={(file) => {
						launchEditor(file)

						return Upload.LIST_IGNORE
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
