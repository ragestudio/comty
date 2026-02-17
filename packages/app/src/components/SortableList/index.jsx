import classnames from "classnames"

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable"
import {
	restrictToVerticalAxis,
	restrictToParentElement,
} from "@dnd-kit/modifiers"

import { CSS } from "@dnd-kit/utilities"

import "./index.less"

export const SortableItem = ({ id, index, disabled = false, children }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, disabled })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: transition,
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1000 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="sortable-item"
			key={id}
		>
			<div
				className={classnames("drag-handle", { disabled })}
				role="button"
				{...attributes}
				{...listeners}
			>
				<svg
					viewBox="0 0 20 20"
					width="12"
				>
					<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
				</svg>
			</div>

			{children}
		</div>
	)
}

export const SortableList = ({
	items = [],
	onChange,
	renderItem,
	itemIdKey = "id",
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

	const onDragEnd = ({ active, over }) => {
		if (!over) return

		if (active.id !== over.id) {
			const oldIndex = items.findIndex(
				(item) => item[itemIdKey] === active.id,
			)
			const newIndex = items.findIndex(
				(item) => item[itemIdKey] === over.id,
			)

			if (oldIndex !== -1 && newIndex !== -1) {
				const newItems = arrayMove(items, oldIndex, newIndex)
				onChange?.(newItems)
			}
		}
	}

	const itemIds = items.map((item) => item[itemIdKey])

	return (
		<DndContext
			onDragEnd={onDragEnd}
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis, restrictToParentElement]}
		>
			<div className={classnames("sortable-list")}>
				<SortableContext
					items={itemIds}
					strategy={verticalListSortingStrategy}
				>
					{items.map((item, index) => {
						const key = item[itemIdKey]

						return (
							<SortableItem
								key={key}
								id={key}
								index={index}
							>
								{renderItem && renderItem(item, index)}
							</SortableItem>
						)
					})}
				</SortableContext>
			</div>
		</DndContext>
	)
}

export default SortableList
