import { Result, Skeleton } from "antd"
import { Icons } from "@components/Icons"

import classnames from "classnames"
import GroupsModel from "@models/groups"

import GroupListItem from "../GroupListItem"

import "./index.less"

const GroupsList = ({ onClickItem, onClickCreateNew, selected }) => {
	const [L_Groups, R_Groups, E_Groups, M_Groups] = app.cores.api.useRequest(
		GroupsModel.getMy,
	)

	const handleMembershipCreated = (data) => {
		console.debug("groups:membership:created", data)
		M_Groups()
	}

	const handleMembershipDeleted = (data) => {
		console.debug("groups:membership:deleted", data)
		M_Groups()
	}

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

	if (E_Groups) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load spaces"
			/>
		)
	}

	if (L_Groups) {
		return <Skeleton active />
	}

	return (
		<div className={classnames("groups-list")}>
			{R_Groups.items.length === 0 && (
				<Result
					status="info"
					title="No spaces"
					subTitle="You have no spaces yet"
				/>
			)}

			{R_Groups.items.map((group) => (
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
