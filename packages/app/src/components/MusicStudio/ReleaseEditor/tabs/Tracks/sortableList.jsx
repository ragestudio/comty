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
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

export default function SortableItem({ id, children }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		cursor: "grab",
	}

	return (
		<div ref={setNodeRef} style={style}>
			{children({
				...attributes,
				...listeners,
				ref: setActivatorNodeRef,
				style: { cursor: "grab", touchAction: "none" },
			})}
		</div>
	)
}

export function SortableList({ items, renderItem, onOrder }) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor),
	)

	const handleDragEnd = (event) => {
		const { active, over } = event
		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((i) => i.id === active.id)
			const newIndex = items.findIndex((i) => i.id === over.id)
			const newItems = arrayMove(items, oldIndex, newIndex)
			onOrder(newItems)
		}
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis]}
		>
			<SortableContext
				items={items}
				strategy={verticalListSortingStrategy}
			>
				{items.map((item, index) => (
					<SortableItem key={item.id} id={item.id}>
						{(handleProps) => (
							<div>
								{renderItem(item, index)}
								<div id="drag-handle" {...handleProps} />
							</div>
						)}
					</SortableItem>
				))}
			</SortableContext>
		</DndContext>
	)
}
