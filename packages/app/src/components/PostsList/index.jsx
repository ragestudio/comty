import React from "react"
import PropTypes from "prop-types"
import * as antd from "antd"
import lodash from "lodash"
import { AnimatePresence } from "motion/react"

import PostCard from "@components/PostCard"
import LoadMore from "@components/LoadMore"

import PostModel from "@models/post"

import "./index.less"

const LoadingComponent = () => {
	return (
		<div className="post_card">
			<antd.Skeleton
				avatar
				style={{
					width: "100%",
				}}
			/>
		</div>
	)
}

const PostActions = {
	onClickLike: async (data) => {
		let result = await PostModel.toggleLike({ post_id: data._id }).catch(
			() => {
				antd.message.error("Failed to like post")

				return false
			},
		)

		return result
	},
	onClickSave: async (data) => {
		let result = await PostModel.toggleSave({ post_id: data._id }).catch(
			() => {
				antd.message.error("Failed to save post")

				return false
			},
		)

		return result
	},
	onClickDelete: async (data) => {
		antd.Modal.confirm({
			title: "Are you sure you want to delete this post?",
			content: "This action is irreversible",
			okText: "Yes",
			okType: "danger",
			cancelText: "No",
			onOk: async () => {
				await PostModel.deletePost({ post_id: data._id }).catch(() => {
					antd.message.error("Failed to delete post")
				})
			},
		})
	},
	onClickEdit: async (data) => {
		app.controls.openPostCreator({
			edit_post: data._id,
		})
	},
	onClickReply: async (data) => {
		app.controls.openPostCreator({
			reply_to: data._id,
		})
	},
	onDoubleClick: async (data) => {
		app.navigation.goToPost(data._id)
	},
}

const Entry = (props) => {
	const { data } = props

	return (
		<PostCard
			key={data._id}
			data={data}
			disableReplyTag={props.disableReplyTag}
			disableHasReplies={props.disableHasReplies}
			events={PostActions}
		/>
	)
}

const PostList = React.forwardRef((props, ref) => {
	if (props.list.length === 0) {
		return (
			<div className="post-list empty bg-accent">
				<antd.Empty description="No posts found" />
			</div>
		)
	}

	return (
		<LoadMore
			ref={ref}
			className="post-list bg-accent"
			loadingComponent={LoadingComponent}
			hasMore={props.hasMore}
			onBottom={props.onLoadMore}
		>
			<AnimatePresence>
				{props.list.map((data) => {
					return (
						<Entry
							key={data._id}
							data={data}
							{...props}
						/>
					)
				})}
			</AnimatePresence>
		</LoadMore>
	)
})

PostList.propTypes = {
	list: PropTypes.array,
	hasMore: PropTypes.bool,
	onLoadMore: PropTypes.func,
}

PostList.displayName = "PostList"

const PostsListsComponent = (props) => {
	const [list, setList] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)
	const [firstLoad, setFirstLoad] = React.useState(true)

	// Refs
	const loading = React.useRef(false)
	const page = React.useRef(0)
	const listRef = React.useRef(null)
	const loadModelPropsRef = React.useRef({})

	const timelineWsEvents = React.useRef({
		"post:new": (data) => {
			console.debug("post:new", data)

			setList((prev) => {
				return [data, ...prev]
			})
		},
		"post:delete": (data) => {
			console.debug("post:delete", data)

			setList((prev) => {
				return prev.filter((item) => {
					return item._id !== data._id
				})
			})
		},
		"post:update": (data) => {
			console.debug("post:update", data)

			setList((prev) => {
				return prev.map((item) => {
					if (item._id === data._id) {
						return data
					}
					return item
				})
			})
		},
	})

	// Logic
	async function handleLoad(fn, params = {}) {
		if (loading.current === true) {
			console.warn(`Please wait to load the post before load more`)
			return
		}

		loading.current = true

		let payload = {
			page: page.current,
			limit: app.cores.settings.get("feed_max_fetch"),
		}

		if (loadModelPropsRef.current) {
			payload = {
				...payload,
				...loadModelPropsRef.current,
			}
		}

		const result = await fn(payload).catch((err) => {
			console.error(err)
			app.message.error("Failed to load more posts")
			return null
		})

		loading.current = false
		setFirstLoad(false)

		if (result) {
			setHasMore(result.has_more)

			if (result.items?.length > 0) {
				if (params.replace) {
					setList(result.items)
					page.current = 0
				} else {
					setList((prev) => {
						return [...prev, ...result.items]
					})
					page.current = page.current + 1
				}
			}
		}
	}

	const onLoadMore = React.useCallback(() => {
		if (typeof props.onLoadMore === "function") {
			return handleLoad(props.onLoadMore)
		} else if (props.loadFromModel) {
			return handleLoad(props.loadFromModel)
		}
	}, [props])

	React.useEffect(() => {
		if (
			!lodash.isEqual(props.loadFromModelProps, loadModelPropsRef.current)
		) {
			loadModelPropsRef.current = props.loadFromModelProps

			page.current = 0
			loading.current = false

			setHasMore(true)
			setList([])
			handleLoad(props.loadFromModel)
		}
	}, [props.loadFromModel, props.loadFromModelProps, firstLoad === false])

	React.useEffect(() => {
		if (props.loadFromModelProps) {
			loadModelPropsRef.current = props.loadFromModelProps
		}

		if (typeof props.loadFromModel === "function") {
			handleLoad(props.loadFromModel)
		}

		if (props.realtime) {
			for (const [event, handler] of Object.entries(
				timelineWsEvents.current,
			)) {
				app.cores.api.listenEvent(event, handler)
			}

			app.cores.api.emitEvent(
				"posts:subscribe",
				props.customTopic ?? "realtime:feed",
			)
		}

		return () => {
			if (props.realtime) {
				for (const [event, handler] of Object.entries(
					timelineWsEvents.current,
				)) {
					app.cores.api.unlistenEvent(event, handler)
				}

				app.cores.api.emitEvent(
					"posts:unsubscribe",
					props.customTopic ?? "realtime:feed",
				)
			}
		}
	}, [])

	if (firstLoad) {
		return (
			<div className="post-list_wrapper">
				<antd.Skeleton />
			</div>
		)
	}

	return (
		<div className="post-list_wrapper">
			<PostList
				ref={listRef}
				list={list}
				hasMore={hasMore}
				onLoadMore={onLoadMore}
				disableReplyTag={props.disableReplyTag}
			/>
		</div>
	)
}

PostsListsComponent.propTypes = {
	realtime: true,
	customTopic: true,
	loadFromModel: true,
	loadFromModelProps: true,
	onLoadMore: true,
}

export default PostsListsComponent
