import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import { MobileUserCard } from "@components/UserCard"
import NFCModel from "comty.js/models/nfc"

import FollowsModel from "@models/follows"

import "./index.less"

const BehaviorTypeToAction = {
	url: "Open an URL",
	profile: "Open profile",
}

const handleAction = {
	url: (value) => {
		window.location.href = value
	},
	profile: (value) => {
		app.navigation.goToAccount(value)
	},
	post: (value) => {
		app.message.error("Not supported yet")
	},
}

export default (props) => {
	const [L_Tag, R_Tag, E_Tag] = app.cores.api.useRequest(
		NFCModel.getTagBySerial,
		props.tag.serialNumber,
	)
	const [isSelf, setSelf] = React.useState(false)
	const [followers, setFollowers] = React.useState(null)
	const [following, setFollowing] = React.useState(null)

	React.useEffect(async () => {
		if (!R_Tag) {
			return null
		}

		const isSelf = R_Tag.user._id === app.userData._id

		if (!isSelf) {
			const followedResult = await FollowsModel.imFollowing(
				R_Tag.user._id,
			).catch(() => false)
			setFollowing(followedResult.isFollowed)
		}

		const followers = await FollowsModel.getFollowers(R_Tag.user._id).catch(
			() => false,
		)

		setSelf(isSelf)
		setFollowers(followers)
	}, [R_Tag])

	if (L_Tag) {
		return <antd.Skeleton active />
	}

	if (!R_Tag || E_Tag) {
		return (
			<antd.Result
				status="error"
				title="Something went wrong"
				subTitle="Sorry but we cannot find this NFC Tag"
			/>
		)
	}

	const onClick = (action) => {
		handleAction[action.type](action.value)

		props.close()
	}

	const actions = [
		R_Tag.behavior,
		{
			type: "profile",
			value: R_Tag.user.username,
		},
	]

	return (
		<div className="nfc_tag_dialog">
			<div className="nfc_tag_dialog__header">
				<MobileUserCard
					user={R_Tag.user}
					isFollowed={following}
					followers={followers}
					isSelf={isSelf}
					preview
				/>
			</div>

			<div className="nfc_tag_dialog__body">
				<h2>
					<Icons.SquareMousePointer /> Choose a action
				</h2>

				{actions.map((action, index) => {
					return (
						<div
							key={index}
							className="nfc_tag_dialog__action"
						>
							<antd.Button
								type="primary"
								block
								onClick={() => {
									onClick(action)
								}}
							>
								{BehaviorTypeToAction[action.type]}
							</antd.Button>

							<span className="nfc_tag_dialog__description">
								{action.value}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}
