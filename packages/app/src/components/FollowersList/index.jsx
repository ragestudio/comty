import React from "react"
import * as antd from "antd"
import { Icons } from "@components/Icons"
import LoadMore from "@components/LoadMore"
import UserPreview from "@components/UserPreview"

import FollowsModel from "@models/follows"

import "./index.less"

const FollowerItem = React.memo(({ data }) => {
	return <UserPreview user={data} />
})

FollowerItem.displayName = "FollowerItem"

const FollowersList = (props) => {
	const [loading, setLoading] = React.useState(false)
	const [followers, setFollowers] = React.useState(props.followers ?? [])
	const [hasMore, setHasMore] = React.useState(true)

	const page = React.useRef(0)
	const userId = React.useRef(props.user_id)

	const loadFollowers = React.useCallback(async () => {
		setLoading(true)

		console.log(
			`Loading Followers for [${userId.current}] page [${page.current}]`,
		)

		const followers = await FollowsModel.getFollowers(userId.current, {
			fetchData: true,
			limit: 10,
			page: page.current,
		}).catch((err) => {
			console.error(err)
			app.message.error("Failed to fetch followers")

			return null
		})

		setLoading(false)

		if (followers) {
			console.log(`Loaded Followers :`, followers)
			setFollowers((prev) => {
				return [...prev, ...followers.items]
			})

			if (followers.has_more) {
				setHasMore(true)
			} else {
				setHasMore(false)
			}
		}
	}, [userId.current])

	const onLoadMore = React.useCallback(() => {
		page.current += 1
		loadFollowers()
	}, [userId.current])

	React.useEffect(() => {
		if (!props.followers) {
			if (props.user_id) {
				userId.current = props.user_id
				page.current = 0
				setFollowers([])
				setHasMore(true)
				loadFollowers()
			}
		}
	}, [props.user_id])

	if (!loading && followers.length === 0) {
		return (
			<antd.Result icon={<Icons.FiUserX style={{ fontSize: "50px" }} />}>
				<h2>It's seems this user has no followers, yet.</h2>
				<h3>Maybe you can help them out?</h3>
			</antd.Result>
		)
	}

	return (
		<LoadMore
			className="followersList"
			onBottom={onLoadMore}
			hasMore={hasMore}
		>
			{followers.map((data) => {
				return <FollowerItem key={data._id} data={data} />
			})}
		</LoadMore>
	)
}

export default FollowersList
