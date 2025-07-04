import React from "react"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
	restrictToVerticalAxis,
	restrictToParentElement,
} from "@dnd-kit/modifiers"

import SortableTrackItem from "../ListItem"

const SortableTrackList = ({
	release,
	tracks = [],
	onReorder,
	getUploadProgress,
	onUpdate,
	onDelete,
	disabled = false,
}) => {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const handleDragEnd = React.useCallback(
		(event) => {
			const { active, over } = event

			if (active.id !== over?.id) {
				const oldIndex = tracks.findIndex(
					(track) => (track._id || track.uid) === active.id,
				)
				const newIndex = tracks.findIndex(
					(track) => (track._id || track.uid) === over.id,
				)

				if (oldIndex !== -1 && newIndex !== -1) {
					const newTracks = arrayMove(tracks, oldIndex, newIndex)
					onReorder?.(newTracks)
				}
			}
		},
		[tracks, onReorder],
	)

	const trackIds = React.useMemo(
		() => tracks.map((track) => track._id || track.uid),
		[tracks],
	)

	if (tracks.length === 0) {
		return null
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis, restrictToParentElement]}
		>
			<SortableContext
				items={trackIds}
				strategy={verticalListSortingStrategy}
			>
				<div className="music-studio-release-editor-tracks-list">
					{tracks.map((track, index) => {
						const progress = getUploadProgress?.(track.uid)
						const isDisabled = disabled || !!progress

						return (
							<SortableTrackItem
								key={track._id || track.uid}
								id={track._id || track.uid}
								track={track}
								index={index}
								progress={progress}
								disabled={isDisabled}
								onUpdate={onUpdate}
								onDelete={onDelete}
								release={release}
							/>
						)
					})}
				</div>
			</SortableContext>
		</DndContext>
	)
}

export default SortableTrackList
