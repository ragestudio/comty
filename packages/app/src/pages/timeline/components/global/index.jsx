import React from "react"

import { PostsList } from "@components"

import Feed from "@models/feed"

import "./index.less"

export default class ExplorePosts extends React.Component {
	render() {
		return (
			<PostsList
				disableHasReplies
				loadFromModel={Feed.getGlobalTimelineFeed}
				realtime
			/>
		)
	}
}
