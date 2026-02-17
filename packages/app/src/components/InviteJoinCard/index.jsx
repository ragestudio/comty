import { Button } from "antd"

import Skeleton from "@components/Skeleton"

import GroupsModel from "@models/groups"
import use from "comty.js/hooks/use"

import "./index.less"

const InviteJoinCard = ({ group_id, invite_key, onClick }) => {
	if (!group_id || !invite_key) {
		return null
	}

	const [joinLoading, setJoinLoading] = React.useState(false)
	const { loading, error, result } = use(
		GroupsModel.invites.get,
		group_id,
		invite_key,
		{
			fetchData: true,
		},
	)

	const onClickJoin = React.useCallback(async () => {
		if (typeof onClick === "function") {
			return await onClick()
		}

		setJoinLoading(true)

		console.log("Joining group...")

		const result = await GroupsModel.invites
			.join({
				group_id: group_id,
				invite_key: invite_key,
			})
			.catch((error) => {
				console.error(error)

				return null
			})

		if (!result) {
			setJoinLoading(false)
			app.message.error("Failed to join")
			return null
		}

		console.log("Joined group", result)
		app.message.success("Joined group")

		setJoinLoading(false)

		app.location.push("/spaces/group/" + group_id)
	}, [group_id, invite_key, onClick])

	if (error) {
		return (
			<div className="invite-join-card bg-accent">
				<p>Failed to load </p>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="invite-join-card bg-accent">
				<Skeleton />
			</div>
		)
	}

	return (
		<div className="invite-join-card bg-accent">
			<div className="invite-join-card__icon bg-accent">
				<img src={result.icon} />
			</div>

			<div className="invite-join-card__content bg-accent">
				<h1>{result.name}</h1>

				{result.expires && <p>Expires: {String(result.expires)}</p>}

				<p>
					Usages:
					{String(result.max_usage - result.usages)}|
					{String(result.max_usage)}
				</p>

				<Button
					className="join"
					type="primary"
					onClick={onClickJoin}
					disabled={joinLoading}
					loading={joinLoading}
				>
					Join group
				</Button>
			</div>
		</div>
	)
}

export default InviteJoinCard
