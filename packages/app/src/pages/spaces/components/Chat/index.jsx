import React from "react"
import { Skeleton } from "antd"
import Button from "@ui/Button"
import { DateTime } from "luxon"
import PropTypes from "prop-types"
import { useInView } from "react-intersection-observer"

import useChannelChat from "comty.js/hooks/useChannelChat"
import useDMChat from "comty.js/hooks/useDMChat"

import { useContentPanelHeaderRender } from "@pages/spaces/contexts/contentPanel"

import Line from "./components/Line"
import ChatInputBar from "./components/InputBar"

import "./index.less"

// if is the same user, in a 3 minutes window, merge with the previous one
function shouldMergeWithNextItem(nextItem, item) {
	if (!nextItem) {
		return false
	}

	if (nextItem.user.username !== item.user.username) {
		return false
	}

	const nextItemCreatedAt = DateTime.fromISO(nextItem.created_at)
	const currentCreatedAt = DateTime.fromISO(item.created_at)

	const timeDiff = currentCreatedAt.diff(nextItemCreatedAt).as("minutes")

	if (timeDiff > 3) {
		return false
	}

	return true
}

const Chat = ({ type = "group", _id, group = {} }) => {
	const {
		timeline,
		loading,
		error,
		send,
		loadBefore,
		loadAfter,
		typing,
		usersTyping,
		initialLoading,
		pausedUpdate,
		setPausedUpdates,
	} =
		type === "group"
			? useChannelChat(group._id, _id, {
					onNewMessage: (...args) => handleOnNewMessage(...args),
				})
			: useDMChat(_id, {
					onNewMessage: (...args) => handleOnNewMessage(...args),
				})

	const topTriggerInView = useInView()

	const timelineRef = React.useRef()
	const canLoadBottom = React.useRef(false)
	const canLoadTop = React.useRef(true)

	const [scrollableToBottom, setScrollableToBottom] = React.useState(false)

	const handleOnNewMessage = async () => {
		const scrollPosition = timelineRef.current.scrollTop

		if (timelineRef.current.scrollTop >= -100 && scrollPosition <= 0) {
			timelineRef.current.scrollTo(0, 0)
			console.log("scrolling due new message")
		}
	}

	const handleOnScroll = React.useCallback(
		(e) => {
			const scrollPosition = Math.abs(timelineRef.current.scrollTop)

			const isScrollBottomInRange =
				scrollPosition >= 0 && scrollPosition < 100

			if (!loading && canLoadBottom.current && isScrollBottomInRange) {
				canLoadBottom.current = false

				console.debug("[chat tab] loading bottom messages")

				loadAfter()
				setPausedUpdates(false)
				setScrollableToBottom(false)
			}

			if (!isScrollBottomInRange && !canLoadBottom.current) {
				canLoadBottom.current = true
				setPausedUpdates(true)
				setScrollableToBottom(true)
			}
		},
		[_id, loadAfter],
	)

	const headerRender = React.useCallback(() => {
		return (
			<>
				{scrollableToBottom && (
					<Button
						size="small"
						shape="default"
						onClick={() => {
							timelineRef.current.scrollTo(0, 0)
						}}
					>
						Go to bottom
					</Button>
				)}

				{usersTyping.length > 0 && (
					<div className="group-page__content-panel__header__content__users-typing">
						{usersTyping.map((user) => (
							<img
								key={user._id}
								src={user.avatar}
								alt={user.username}
							/>
						))}
						<span>is typing...</span>
					</div>
				)}
			</>
		)
	}, [_id, usersTyping, scrollableToBottom])

	useContentPanelHeaderRender(headerRender)

	// load more data when scroll is on top
	React.useEffect(() => {
		if (!loading && topTriggerInView.inView && canLoadTop.current) {
			console.debug("[chat tab] loading more messages")

			loadBefore()
			canLoadTop.current = false
		}

		if (!topTriggerInView.inView && !canLoadTop.current) {
			canLoadTop.current = true
		}
	}, [loadBefore, topTriggerInView])

	React.useEffect(() => {
		if (timelineRef.current) {
			timelineRef.current.addEventListener("scroll", handleOnScroll)
		}

		return () => {
			if (timelineRef.current) {
				timelineRef.current.removeEventListener(
					"scroll",
					handleOnScroll,
				)
			}
		}
	}, [timelineRef.current])

	if (error) {
		return <p>Error: {error.message}</p>
	}

	if (initialLoading) {
		return <p>Loading...</p>
	}

	return (
		<div
			className="channel-chat"
			data-is-dm={type === "direct"}
			data-type={type}
			data-channel-id={_id}
			data-group-id={group._id}
		>
			<div
				id="chat-timeline"
				className="channel-chat__timeline bg-accent"
				ref={timelineRef}
			>
				{timeline.map((item, index) => {
					const headless = shouldMergeWithNextItem(
						timeline[index + 1],
						item,
					)

					return (
						<Line
							key={item._id}
							data={item}
							headless={headless}
						/>
					)
				})}

				<div
					className="channel-chat__timeline__top-trigger"
					ref={topTriggerInView.ref}
				>
					<Skeleton avatar />
				</div>
			</div>

			<ChatInputBar
				send={send}
				typing={typing}
				channel_id={_id}
			/>
		</div>
	)
}

Chat.propTypes = {
	_id: PropTypes.string.isRequired,
}

export default Chat
