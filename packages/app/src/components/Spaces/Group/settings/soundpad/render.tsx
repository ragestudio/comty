import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import React from "react"
import { Empty, Skeleton } from "antd"
import classNames from "clsx"

import { Icons } from "@components/Icons"
import { useGroupData } from "@comty/spaces-sdk/group"
import getErrorMessage from "@utils/getErrorMessage"
import createBem from "@/utils/createBem"

import AddSoundpadItem from "./components/AddSoundpadItem"
import SoundpadItemRow from "./components/SoundpadItemRow"
import { useSoundpadItems } from "./useSoundpadItems"

import styles from "./index.module.less"
const b = createBem("soundpad-settings", styles)

export const SoundpadSettings = () => {
	const group = useGroupData()
	const groupId = group?._id

	const { items, loading, error, add, update, remove } =
		useSoundpadItems(groupId)

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
				setPlayingId((current) => (current === item._id ? null : current))
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

	const onDelete = async (item: SoundpadItemPayload) => {
		if (playingId === item._id) {
			stopPreview()
		}

		await remove(item._id!)
	}

	const onAdd = async (
		payload: Pick<SoundpadItemPayload, "icon" | "name" | "src">,
	) => {
		await add(payload)
	}

	const onEditSoundpadItem = async (data: SoundpadItemPayload) => {
		return await update(data)
	}

	const customItems = items.filter((item) => !item.built_in)

	if (loading) {
		return (
			<div className={b()}>
				<Skeleton active />
			</div>
		)
	}

	if (error) {
		return (
			<div className={b()}>
				<p>Failed to load soundpad: {getErrorMessage(error)}</p>
			</div>
		)
	}

	return (
		<div className={b()}>
			<div className={b.elem("header")}>
				<h2>
					<Icons.Drum /> Soundpad
				</h2>
			</div>

			<AddSoundpadItem onSubmit={onAdd} />

			<div
				className={classNames(b.elem("section"), "bg-accent", "border-default")}
			>
				<h4>Group sounds</h4>

				{customItems.length === 0 && (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
				)}

				{customItems.map((item) => (
					<SoundpadItemRow
						key={item._id}
						item={item}
						playing={playingId === item._id}
						onPreview={preview}
						onDelete={onDelete}
						onEdit={onEditSoundpadItem}
					/>
				))}
			</div>
		</div>
	)
}

export default SoundpadSettings
