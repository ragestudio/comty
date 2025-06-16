import React from "react"
import { Result } from "antd"

import PostsList from "@components/PostsList"
import { Icons } from "@components/Icons"

import PostModel from "@models/post"

const emptyListRender = () => {
	return (
		<Result icon={<Icons.FiUserX style={{ fontSize: "50px" }} />}>
			<h2>It's seems this user has no public post, yet.</h2>
		</Result>
	)
}

export default class UserPosts extends React.Component {
	render() {
		console.log(this.props.state)
		return (
			<PostsList
				onTopVisibility={this.props.onTopVisibility}
				emptyListRender={emptyListRender}
				loadFromModel={PostModel.getUserPosts}
				loadFromModelProps={{
					user_id: this.props.state.user._id,
				}}
			/>
		)
	}
}
