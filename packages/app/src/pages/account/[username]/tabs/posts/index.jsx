import React from "react"
import { Result } from "antd"

import { useNavigation } from "react-router"

import PostsList from "@components/PostsList"
import { Icons } from "@components/Icons"

import PostModel from "@models/post"

const emptyListRender = () => {
	return (
		<Result icon={<Icons.UserX style={{ fontSize: "50px" }} />}>
			<h2>It's seems this user has no public post, yet.</h2>
		</Result>
	)
}

const UserPosts = (props) => {
	return (
		<PostsList
			onTopVisibility={props.onTopVisibility}
			emptyListRender={emptyListRender}
			loadFromModel={PostModel.getUserPosts}
			loadFromModelProps={{
				user_id: props.state.user._id,
			}}
		/>
	)
}

export default UserPosts
