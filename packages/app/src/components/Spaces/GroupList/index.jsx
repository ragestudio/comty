import use from "comty.js/hooks/use"
import { Result, Skeleton } from "antd"
import { Icons } from "@components/Icons"
import classnames from "classnames"

import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move } from "@dnd-kit/helpers"

import GroupsModel from "@models/groups"

import GroupListItem from "../GroupListItem"

import "./index.less"

const SortableItem = ({ group, index, onClick, selected }) => {
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

const GroupsList = ({ onClickItem, onClickCreateNew, selected, sortable }) => {
	const { loading, error, result, setResult, repeat } = use(GroupsModel.getMy)

	const handleMembershipCreated = (data) => {
		console.debug("groups:membership:created", data)
		repeat()
	}

	const handleMembershipDeleted = (data) => {
		console.debug("groups:membership:deleted", data)
		repeat()
	}

	const handleOnDragEndItems = React.useCallback(
		async (event) => {
			if (!sortable) {
				return true
			}

			const newItems = move(result.items, event)
			const newItemsIds = newItems.map((item) => item._id)

			setResult((r) => {
				r.items = newItems
				return r
			})

			try {
				const sortResult = await GroupsModel.sort(newItemsIds)
				console.debug({ sortResult })
			} catch (err) {
				console.error("failed to update group order")
			}
		},
		[sortable, result, setResult],
	)

	React.useEffect(() => {
		const socket = app.cores.api.socket()

		if (socket) {
			socket.on("groups:membership:created", handleMembershipCreated)
			socket.on("groups:membership:deleted", handleMembershipDeleted)
		}

		return () => {
			if (socket) {
				socket.off("groups:membership:created", handleMembershipCreated)
				socket.off("groups:membership:deleted", handleMembershipDeleted)
			}
		}
	}, [])

	if (error) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load groups"
			/>
		)
	}

	if (loading) {
		return <Skeleton active />
	}

	return (
		<div className={classnames("groups-list")}>
			{result.items.length === 0 && (
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
					{result.items.map((group, index) => (
						<SortableItem
							key={group._id}
							index={index}
							group={group}
							onClick={onClickItem}
							selected={selected === group._id}
						/>
					))}
				</DragDropProvider>
			)}

			{!sortable &&
				result.items.map((group) => (
					<GroupListItem
						key={group._id}
						group={group}
						onClick={onClickItem}
						selected={selected === group._id}
					/>
				))}

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
