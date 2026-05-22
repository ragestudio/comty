import React from "react"
import { Result, Skeleton } from "antd"
import { DateTime } from "luxon"
import { AnimatePresence, motion } from "motion/react"
import PropTypes from "prop-types"
import { useOnInView } from "react-intersection-observer"

import Icons from "@components/Icons"
import Button from "@ui/Button"
import ChatInputBar from "./components/InputBar"
import Line from "./components/Line"

import useChat from "@contexts/WithSpaces/chat"

import "./index.less"

// if is the same user, in a 3 minutes window, merge with the previous one
function shouldMergeWithNextItem(nextItem, item) {
	if (!nextItem) {
		return false
	}

	if (nextItem.user_id !== item.user_id) {
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

const useTriggerValue = (callback) => {
	const prevValueRef = React.useRef(false)

	return (value) => {
		if (value === true && prevValueRef.current === false) {
			callback()
		}

		prevValueRef.current = value
	}
}

const Chat = ({ _id, type = "group", group }) => {
	let useChatParam = {}

	if (!_id || !type) {
		return null
	}

	if (type === "group" && !group) {
		console.error("Chat with type group, must provide a group context")
		return null
	}

	if (type === "group") {
		useChatParam = { group_id: group.data._id, channel_id: _id }
	}

	if (type === "dm") {
		useChatParam = { to_user_id: _id }
	}

	const timelineRef = React.useRef()
	const [scrollableToBottom, setScrollableToBottom] = React.useState(false)

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
	} = useChat(type, useChatParam, {
		onNewMessage: () => handleOnNewMessage(),
	})

	const bottomTrigger = useTriggerValue(() => {
		console.debug("View is BOTTOM, loading lasts messages")
		loadAfter()
	})

	const topTrigger = useTriggerValue(() => {
		console.debug("View is TOP, loading older messages")
		loadBefore()
	})

	const topTriggerRef = useOnInView((inView) => topTrigger(inView))

	const goToBottom = React.useCallback(() => {
		if (timelineRef.current) {
			timelineRef.current.scrollTo(0, 0)
		}
	}, [timelineRef])

	const handleOnNewMessage = React.useCallback(() => {
		if (!timelineRef.current || pausedUpdate) {
			return
		}

		if (!scrollableToBottom) {
			timelineRef.current.scrollTo(0, 0)
		}
	}, [timelineRef, pausedUpdate])

	const handleOnScroll = React.useCallback((e) => {
		const scrollPosition = Math.abs(timelineRef.current.scrollTop)
		const isOnBottom = scrollPosition >= 0 && scrollPosition < 100

		bottomTrigger(isOnBottom)

		if (isOnBottom) {
			setPausedUpdates(false)
			setScrollableToBottom(false)
		} else {
			setPausedUpdates(true)
			setScrollableToBottom(true)
		}
	}, [])

	React.useEffect(() => {
		if (initialLoading) {
			return
		}

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
	}, [initialLoading, timelineRef.current])

	if (error) {
		return (
			<Result
				status="warning"
				title="Failed to load messages"
				subTitle={error.message}
			/>
		)
	}

	if (initialLoading) {
		return null
	}

	const trimmedUsersTyping = usersTyping?.slice(0, 3)
	const isUsersTypingOverflowing = usersTyping?.length > 3

	const usernamesTyping = trimmedUsersTyping.reduce((str, user) => {
		return `${str} ${user.username},`
	}, "")

	return (
		<div
			className="channel-chat"
			data-is-dm={type === "direct"}
			data-type={type}
			data-channel-id={_id}
			data-group-id={group?.data?._id}
		>
			<div className="channel-chat__wrapper bg-accent">
				<div
					id="chat-timeline"
					className="channel-chat__wrapper__timeline"
					ref={timelineRef}
				>
					<AnimatePresence mode="sync">
						{usersTyping.length > 0 && (
							<motion.div
								className="channel-chat__timeline__typers"
								animate={{
									height: "100%",
									left: 0,
									y: 0,
								}}
								exit={{
									height: 0,
									y: 50,
								}}
								initial={{
									height: 0,
									y: 50,
								}}
								style={{
									"--items": trimmedUsersTyping.length,
								}}
							>
								<div className="channel-chat__timeline__typers__images">
									{trimmedUsersTyping.map((user) => (
										<img
											key={user._id}
											src={user.avatar}
											alt={user.username}
										/>
									))}
								</div>

								<span>
									{usernamesTyping}{" "}
									{isUsersTypingOverflowing && "and more,"}{" "}
									are typing...
								</span>
							</motion.div>
						)}
					</AnimatePresence>

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
						ref={topTriggerRef}
					>
						<Skeleton avatar />
					</div>
				</div>

				<AnimatePresence>
					{scrollableToBottom && (
						<motion.div
							className="channel-chat__timeline__scrollToBottom"
							animate={{
								y: 0,
							}}
							exit={{
								y: 50,
							}}
							initial={{
								y: 50,
							}}
						>
							<div className="channel-chat__timeline__scrollToBottom__container bg-accent">
								<Button
									type="ghost"
									onClick={goToBottom}
								>
									<Icons.ArrowDownToLine /> Go to recent
									messages
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
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
