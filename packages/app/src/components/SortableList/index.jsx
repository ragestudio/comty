import React from "react"
import { Button } from "antd"
import { Icons, createIconRender } from "components/Icons"
import classnames from "classnames"
import useLongPress from "hooks/useLongPress"

import {
    DndContext,
    TouchSensor,
    MouseSensor,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import "./index.less"

export const SortableItemChildrenContext = React.createContext({
    attributes: {},
    listeners: undefined,
    ref() { },
    activeDrag: true,
})

export const SortableItemContext = React.createContext({
    activeDrag: true,
    onLongPress() { },
    setActiveDrag() { },
})

export function DragHandle() {
    const { attributes, listeners, ref, activeDrag } = React.useContext(SortableItemChildrenContext)

    return (
        <button
            className={classnames(
                "drag-handle",
                {
                    ["active"]: activeDrag
                }
            )}
            {...attributes}
            {...listeners}
            ref={ref}
        >
            <svg viewBox="0 0 20 20" width="12">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
            </svg>
        </button>
    )
}

export function SortableOverlay({ children }) {
    const dropAnimationConfig = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: "0.4"
                }
            }
        })
    }

    return (
        <DragOverlay dropAnimation={dropAnimationConfig}>{children}</DragOverlay>
    )
}

export function SortableItem({
    children,
    id,
}) {
    const { activeDrag, onLongPress } = React.useContext(SortableItemContext)

    const {
        attributes,
        isDragging,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const context = React.useMemo(
        () => ({
            attributes,
            listeners,
            ref: setActivatorNodeRef,
            activeDrag: activeDrag
        }),
        [attributes, listeners, setActivatorNodeRef, activeDrag]
    )

    const style = {
        opacity: isDragging ? 0.4 : undefined,
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <SortableItemChildrenContext.Provider value={context}>
            <li
                className="sortable-item"
                ref={setNodeRef}
                style={style}
                {...useLongPress(onLongPress)}
            >
                {children}
                <DragHandle />
            </li>
        </SortableItemChildrenContext.Provider>
    )
}

export const DragActiveActions = ({
    actions
}) => {
    const { activeDrag, setActiveDrag } = React.useContext(SortableItemContext)

    return <div
        className={classnames(
            "drag-actions",
            {
                ["active"]: activeDrag
            }
        )}
    >
        <Button
            type="primary"
            size="small"
            icon={<Icons.Check />}
            onClick={() => setActiveDrag(false)}
        />

        {
            actions?.map((action, index) => {
                return <Button
                    key={index}
                    type={action.type ?? "default"}
                    size="small"
                    icon={createIconRender(action.icon)}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    danger={action.danger}
                >
                    {action.label}
                </Button>
            })
        }
    </div>
}

export const SortableList = ({
    items,
    onChange,
    renderItem,
    activationConstraint,
    useDragOverlay,
    useActiveDragActions = true,
    activeDragActions,
}) => {
    const [active, setActive] = React.useState(null)
    const [activeDrag, setActiveDrag] = React.useState(false)

    const activeItem = React.useMemo(() => items.find((item) => item.id === active?.id), [active, items])

    const context = React.useMemo(
        () => ({
            activeDrag,
            onLongPress: () => setActiveDrag(true),
            setActiveDrag: setActiveDrag,
        }),
    )

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint,
        }),
        useSensor(TouchSensor, {
            activationConstraint,
        }),
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const onDragStart = ({ active }) => {
        if (!activeDrag) {
            return
        }

        setActive(active)
    }

    const onDragEnd = ({ active, over }) => {
        if (!activeDrag) {
            return
        }

        if (over && active.id !== over?.id) {
            const activeIndex = items.findIndex(({ id }) => id === active.id);
            const overIndex = items.findIndex(({ id }) => id === over.id);

            onChange(arrayMove(items, activeIndex, overIndex));
        }

        setActive(null);
    }

    const onDragCancel = () => {
        setActive(null)
    }

    return <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
    >
        <SortableContext items={items}>
            <SortableItemContext.Provider value={context}>
                <ul
                    className={classnames(
                        "shortable-list",
                        {
                            ["active-drag"]: activeDrag
                        }
                    )}
                    role="application"
                >
                    {
                        items.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {
                                    renderItem(item, index)
                                }
                            </React.Fragment>
                        ))
                    }
                </ul>

                {
                    useActiveDragActions && <DragActiveActions
                        actions={activeDragActions}
                    />
                }
            </SortableItemContext.Provider>
        </SortableContext>

        {
            useDragOverlay && <SortableOverlay>
                {activeItem ? renderItem(activeItem) : null}
            </SortableOverlay>
        }
    </DndContext>
}