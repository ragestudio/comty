import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Empty, Skeleton } from "antd"

import getErrorMessage from "@utils/getErrorMessage"

import SoundpadItemRow from "./SoundpadItemRow"

export type SoundpadSettingsListProps = {
	items: SoundpadItemPayload[]
	loading: boolean
	error: Error | null
	onUpdate: (
		item: SoundpadItemPayload,
	) => Promise<SoundpadItemPayload | null> | SoundpadItemPayload | null
	onDelete: (item: SoundpadItemPayload) => Promise<boolean | void> | void
	emptyDescription?: string
}

const SoundpadSettingsList = ({
	items,
	loading,
	error,
	onUpdate,
	onDelete,
	emptyDescription = "No sounds added yet",
}: SoundpadSettingsListProps) => {
	const audioRef = React.useRef<HTMLAudioElement | null>(null)
	const [playingId, setPlayingId] = React.useState<string | null>(null)

	const stopPreview = React.useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current = null
		}

		setPlayingId(null)
	}, [])

	React.useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current = null
			}
		}
	}, [])

	const preview = React.useCallback(
		(item: SoundpadItemPayload) => {
			if (playingId === item._id) {
				stopPreview()
				return
			}

			stopPreview()

			const audio = new Audio(item.src)

			audio.onended = () => {
				setPlayingId((current) =>
					current === item._id ? null : current,
				)
			}

			audio.onerror = () => {
				app.message.error("Failed to play sound")
				stopPreview()
			}

			audioRef.current = audio
			setPlayingId(item._id)

			audio.play().catch((err) => {
				app.message.error(getErrorMessage(err, "Failed to play sound"))
				stopPreview()
			})
		},
		[playingId, stopPreview],
	)

	const handleDelete = React.useCallback(
		async (item: SoundpadItemPayload) => {
			if (playingId === item._id) {
				stopPreview()
			}

			await onDelete(item)
		},
		[onDelete, playingId, stopPreview],
	)

	if (loading) {
		return <Skeleton active />
	}

	if (error) {
		return <p>Failed to load soundpad: {getErrorMessage(error)}</p>
	}

	if (items.length === 0) {
		return (
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description={emptyDescription}
			/>
		)
	}

	return (
		<>
			{items.map((item) => (
				<SoundpadItemRow
					key={item._id}
					item={item}
					playing={playingId === item._id}
					onPreview={preview}
					onDelete={handleDelete}
					onEdit={onUpdate}
				/>
			))}
		</>
	)
}

export default SoundpadSettingsList
