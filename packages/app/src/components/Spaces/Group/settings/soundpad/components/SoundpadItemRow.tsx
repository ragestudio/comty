import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import { Button, Tag } from "antd"

import ConfirmButton from "@ui/ConfirmButton"
import { Icons } from "@components/Icons"

export type SoundpadItemRowProps = {
	item: SoundpadItemPayload
	playing: boolean
	onPreview: (item: SoundpadItemPayload) => void
	onDelete: (item: SoundpadItemPayload) => void
}

const SoundpadItemRow = ({
	item,
	playing,
	onPreview,
	onDelete,
}: SoundpadItemRowProps) => {
	return (
		<div className="soundpad-settings__item">
			<div className="soundpad-settings__item__icon">{item.icon}</div>

			<div className="soundpad-settings__item__info">
				<p>{item.name}</p>
				{item.built_in && <Tag>Default</Tag>}
			</div>

			<Button
				size="small"
				icon={playing ? <Icons.Square /> : <Icons.Play />}
				onClick={() => onPreview(item)}
			>
				{playing ? "Stop" : "Preview"}
			</Button>

			{!item.built_in && (
				<ConfirmButton
					icon={<Icons.Trash />}
					onConfirm={() => onDelete(item)}
				/>
			)}
		</div>
	)
}

export default SoundpadItemRow
