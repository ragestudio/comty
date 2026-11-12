import type { Group } from "@comty/shared/types/spaces/group"

import React from "react"
import { Result, Skeleton } from "antd"
import { Icons } from "@components/Icons"
import classnames from "classnames"

import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move } from "@dnd-kit/helpers"

import { useGroupsList } from "@comty/spaces-sdk/groupsList"

import GroupListItem, {
	GroupListActionItem,
} from "@components/Spaces/GroupListItem"

import "./index.less"

interface SortableItemProps {
	group: Group
	index: number
	onClick?: (group: Group) => void
	selected?: boolean
}

const SortableItem = ({
	group,
	index,
	onClick,
	selected,
}: SortableItemProps) => {
	const sortable = useSortable({ id: group._id, index })

	return (
		<GroupListItem
			elementRef={sortable.ref}
			group={group}
			onClick={onClick}
			selected={selected}
		/>
	)
}

export interface GroupsListProps {
	onClickItem?: (group: Group) => void
	onClickCreateNew?: () => void
	selected?: string | null
	sortable?: boolean
}

const GroupsList = ({
	onClickItem,
	onClickCreateNew,
	selected,
	sortable,
}: GroupsListProps) => {
	const { groups, loading, error, actions } = useGroupsList()

	React.useEffect(() => {
		actions.fetchGroups()
	}, [])

	const handleOnDragEndItems = React.useCallback(
		async (event: any) => {
			if (!sortable) {
				return true
			}

			const currentIds = groups.map((item) => item._id)
			const newItemsIds = move(currentIds, event)

			const newItems = newItemsIds.map((id) =>
				groups.find((item) => item._id === id)!,
			)

			actions.setGroups(newItems)

			await actions.sortGroups(newItemsIds)
		},
		[sortable, groups, actions],
	)

	if (error) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load groups"
			/>
		)
	}

	if (loading || groups === undefined || groups === null) {
		return <Skeleton active />
	}

	return (
		<div className={classnames("groups-list")}>
			{sortable && (
				<DragDropProvider
					onDragEnd={handleOnDragEndItems}
					modifiers={[RestrictToVerticalAxis]}
				>
					{groups.map((group, index) => {
						return (
							<SortableItem
								key={group._id}
								index={index}
								group={group}
								onClick={onClickItem}
								selected={selected === group._id}
							/>
						)
					})}
				</DragDropProvider>
			)}

			{!sortable &&
				groups.map((group) => {
					return (
						<GroupListItem
							key={group._id}
							group={group}
							onClick={onClickItem}
							selected={selected === group._id}
						/>
					)
				})}

			<GroupListActionItem
				id="create-space-button"
				icon={<Icons.Plus />}
				title="Create a space"
				onClick={onClickCreateNew}
			/>
		</div>
	)
}

export default GroupsList
