import React from "react"
import { Dropdown } from "antd"
import { Icons } from "@components/Icons"

import checkUserIdIsSelf from "@utils/checkUserIdIsSelf"

import SaveButton from "./saveButton"
import LikeButton from "./likeButton"
import RepliesButton from "./replyButton"

import "./index.less"

const SelfActionsItems = [
	{
		key: "onClickEdit",
		label: (
			<>
				<Icons.Pen />
				<span>Edit</span>
			</>
		),
	},
	{
		key: "onClickDelete",
		label: (
			<>
				<Icons.Trash />
				<span>Delete</span>
			</>
		),
	},
	{
		type: "divider",
	},
]

const MoreActionsItems = [
	// {
	//     key: "onClickRepost",
	//     label: <>
	//         <Icons.MdCallSplit />
	//         <span>Repost</span>
	//     </>,
	// },
	{
		key: "onClickShare",
		label: (
			<>
				<Icons.FiShare />
				<span>Share</span>
			</>
		),
	},
	{
		type: "divider",
	},
	{
		key: "onClickReport",
		label: (
			<>
				<Icons.FiAlertTriangle />
				<span>Report</span>
			</>
		),
	},
]

const BuiltInActions = {
	onClickShare: (post) => {
		navigator.share({
			title: post.title,
			text: `Check this post on Comty`,
			url: post.share_url,
		})
	},
	onClickReport: (post) => {},
}

const PostActions = (props) => {
	const [isSelf, setIsSelf] = React.useState(false)

	const { onClickLike, onClickSave, onClickReply } = props.actions ?? {}

	const generateMoreMenuItems = () => {
		let items = MoreActionsItems

		if (isSelf) {
			items = [...SelfActionsItems, ...items]
		}

		return items
	}

	const handleDropdownClickItem = (e) => {
		const action = BuiltInActions[e.key] ?? props.actions[e.key]

		if (typeof action === "function") {
			action(props.post)
		}
	}

	return (
		<div className="post_actions_wrapper">
			<div className="actions">
				<div
					className="action"
					id="likes"
				>
					<LikeButton
						defaultLiked={props.defaultLiked}
						count={props.likesCount}
						onClick={onClickLike}
					/>
				</div>
				<div
					className="action"
					id="save"
				>
					<SaveButton
						defaultActive={props.defaultSaved}
						onClick={onClickSave}
					/>
				</div>
				<div
					className="action"
					id="replies"
				>
					<RepliesButton
						count={props.repliesCount}
						onClick={onClickReply}
					/>
				</div>
				<div
					className="action"
					id="more"
				>
					<Dropdown
						menu={{
							items: generateMoreMenuItems(),
							onClick: handleDropdownClickItem,
						}}
						trigger={["click"]}
						onOpenChange={(open) => {
							if (open && props.user_id) {
								const isSelf = checkUserIdIsSelf(props.user_id)

								setIsSelf(isSelf)
							}
						}}
						overlayStyle={{
							minWidth: "200px",
						}}
					>
						<div className="icon">
							<Icons.FiMoreHorizontal />
						</div>
					</Dropdown>
				</div>
			</div>
		</div>
	)
}

export default PostActions
