import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"
import { SOUNDPAD_MAX_DURATION_SECONDS } from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Button, Input } from "antd"

import ConfirmButton from "@ui/ConfirmButton"
import { Icons } from "@components/Icons"
import createBem from "@/utils/createBem"

import Popover from "@ui/Popover"
import EmojiPicker from "@/components/Expressions/EmojiPicker"

import { openAudioClipEditor } from "@components/AudioClipEditor"

import { uploadAudioFile } from "./audio"

import styles from "./SoundpadItemRow.module.less"

const b = createBem("soundpad-settings__item", styles)

export type SoundpadItemRowProps = {
	item: SoundpadItemPayload
	playing: boolean
	onPreview: (item: SoundpadItemPayload) => void
	onDelete: (item: SoundpadItemPayload) => void
	onEdit?: (
		item: SoundpadItemPayload,
	) => Promise<SoundpadItemPayload | null> | SoundpadItemPayload | null
}

const SoundpadItemRow = ({
	item,
	playing,
	onPreview,
	onDelete,
	onEdit,
}: SoundpadItemRowProps) => {
	const [data, setData] = React.useState<typeof item>(item)

	React.useEffect(() => {
		setData(item)
	}, [item])

	const editDataField = (field: string, value: any) => {
		setData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSaveEdit = React.useCallback(async () => {
		if (typeof onEdit === "function") {
			const result = await onEdit(data)

			if (result) setData(result)
		}
	}, [data])

	const handleClipSaved = async (url: string) => {
		const next = {
			...data,
			src: url,
		}

		setData(next)

		if (typeof onEdit === "function") {
			const result = await onEdit(next)

			if (result) setData(result)
		}
	}

	const launchEditor = () => {
		openAudioClipEditor({
			source: data.src,
			maxDuration: SOUNDPAD_MAX_DURATION_SECONDS,
			title: "Adjust sound clip",
			onSave: async (file) => {
				const url = await uploadAudioFile(file)

				await handleClipSaved(url)
			},
		})
	}

	const hasChanges = React.useCallback(() => {
		return (
			data.icon !== item.icon ||
			data.name !== item.name ||
			data.src !== item.src
		)
	}, [item, data])

	return (
		<div className={b()}>
			<Popover
				className={b.elem("emoji-select")}
				portal
				content={({ close }) => (
					<EmojiPicker
						injectChar={(char: string) =>
							editDataField("icon", char)
						}
						close={close}
					/>
				)}
				position="bottom"
			>
				<div className={b.elem("icon")}>{data.icon}</div>
			</Popover>

			<div className={b.elem("info")}>
				<Input
					value={data.name}
					onChange={(e) => editDataField("name", e.target.value)}
				/>
			</div>

			<Button
				size="small"
				icon={<Icons.Scissors />}
				onClick={launchEditor}
			>
				Clip
			</Button>

			<Button
				size="small"
				icon={playing ? <Icons.Square /> : <Icons.Play />}
				onClick={() => onPreview(data)}
			>
				{playing ? "Stop" : "Preview"}
			</Button>

			<ConfirmButton
				icon={<Icons.Trash />}
				onConfirm={() => onDelete(data)}
			/>

			{hasChanges() && (
				<ConfirmButton
					icon={<Icons.Save />}
					onConfirm={() => handleSaveEdit()}
					onCancel={() => setData(item)}
				/>
			)}
		</div>
	)
}

export default SoundpadItemRow
