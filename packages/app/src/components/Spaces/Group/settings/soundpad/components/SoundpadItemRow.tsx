import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import { Button, Input, Tag } from "antd"

import ConfirmButton from "@ui/ConfirmButton"
import { Icons } from "@components/Icons"
import createBem from "@/utils/createBem"

import styles from "./SoundpadItemRow.module.less"
import Popover from "@/ui/Popover"
import EmojiPicker from "@/components/Expressions/EmojiPicker"
import React from "react"

const b = createBem("soundpad-settings__item", styles)

export type SoundpadItemRowProps = {
	item: SoundpadItemPayload
	playing: boolean
	onPreview: (item: SoundpadItemPayload) => void
	onDelete: (item: SoundpadItemPayload) => void
	onEdit?: (
		item: SoundpadItemPayload,
	) => Promise<SoundpadItemPayload> | SoundpadItemPayload
}

const SoundpadItemRow = ({
	item,
	playing,
	onPreview,
	onDelete,
	onEdit,
}: SoundpadItemRowProps) => {
	const [data, setData] = React.useState<typeof item>(item)

	const editDataField = (field: string, value: any) => {
		setData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSaveEdit = React.useCallback(async () => {
		if (typeof onEdit === "function") {
			setData(await onEdit(data))
		}
	}, [data])

	const hasChanges = React.useCallback(() => {
		return item !== data
	}, [item, data])

	return (
		<div className={b()}>
			<Popover
				className={b.elem("emoji-select")}
				content={({ close }) => (
					<EmojiPicker
						injectChar={(char: string) => editDataField("icon", char)}
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
