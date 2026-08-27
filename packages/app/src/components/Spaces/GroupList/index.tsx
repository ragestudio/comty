import React from "react"
import { Result, Skeleton } from "antd"
import { Icons } from "@components/Icons"
import classnames from "classnames"

import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move } from "@dnd-kit/helpers"

//import useAckNotifications from "@hooks/useAckNotifications"
import { useGroupsList } from "@comty/spaces-lib"

import GroupListItem from "../GroupListItem"

import "./index.less"

const SortableItem = ({ group, index, onClick, selected }: any) => {
	const sortable = useSortable({ id: group._id, index })

	return (
		<GroupListItem
			ref={sortable.ref}
			key={group._id}
			group={group}
			onClick={onClick}
			selected={selected}
		/>
	)
}

const GroupsList = ({ onClickItem, onClickCreateNew, selected, sortable }: any) => {
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

			const newItems = newItemsIds.map(
				(id) => groups.find((item) => item._id === id)!
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
			{groups.length === 0 && (
				<Result
					status="info"
					title="No spaces"
					subTitle="You have no spaces yet"
				/>
			)}

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
							ref={null}
							key={group._id}
							group={group}
							onClick={onClickItem}
							selected={selected === group._id}
						/>
					)
				})}

			<div
				id="create-space-button"
				className={classnames("group-list__item", "bg-accent")}
				onClick={onClickCreateNew}
			>
				<div
					className="group-list__item__icon"
					style={{
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Icons.Plus
						style={{
							fontSize: "1rem",
						}}
					/>
				</div>

				<div className="group-list__item__content">
					<h3>Create a space</h3>
				</div>
			</div>
		</div>
	)
}

export default GroupsList
