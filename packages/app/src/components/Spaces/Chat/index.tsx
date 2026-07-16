import React from "react"
import { Result, Skeleton } from "antd"
import { DateTime } from "luxon"
import { AnimatePresence, motion } from "motion/react"
import { useOnInView } from "react-intersection-observer"

import Icons from "@components/Icons"
import Button from "@ui/Button"
import ChatInputBar from "./components/InputBar"
import Line from "./components/Line"

import useChat from "@contexts/WithSpaces/chat"
import { ExtendedMessage as Message } from "@contexts/WithSpaces/chat/types"

import "./index.less"

// if is the same user, in a 3 minutes window, merge with the previous one
function shouldMergeWithNextItem(nextItem: Message | undefined, item: Message) {
	if (!nextItem) {
		return false
	}

	if (nextItem.user_id !== item.user_id) {
		return false
	}

	const nextItemCreatedAt = DateTime.fromISO(nextItem.created_at as any)
	const currentCreatedAt = DateTime.fromISO(item.created_at as any)

	const timeDiff = currentCreatedAt.diff(nextItemCreatedAt).as("minutes")

	if (timeDiff > 3) {
		return false
	}

	return true
}

const useTriggerValue = (callback: () => void) => {
	const prevValueRef = React.useRef(false)
	const callbackRef = React.useRef(callback)
	callbackRef.current = callback

	return React.useCallback((value: boolean) => {
		if (value === true && prevValueRef.current === false) {
			callbackRef.current()
		}

		prevValueRef.current = value
	}, [])
}

interface ChatProps {
	_id: string
	type?: "group" | "dm"
	group?: any
}

const Chat = ({ _id, type = "group", group }: ChatProps) => {
	let useChatParam: any = {}

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

	const timelineRef = React.useRef<HTMLDivElement>(null)
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
		pausedUpdates,
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

	const { ref: topTriggerRef } = useOnInView({
		onChange: (inView) => topTrigger(inView),
	})

	const goToBottom = React.useCallback(() => {
		if (timelineRef.current) {
			// unpause updates so new messages start flowing again
			setPausedUpdates(false)
			setScrollableToBottom(false)
			timelineRef.current.scrollTo(0, 0)
		}
	}, [setPausedUpdates, setScrollableToBottom])

	const scrollableToBottomRef = React.useRef(scrollableToBottom)
	scrollableToBottomRef.current = scrollableToBottom

	const pausedUpdatesRef = React.useRef(pausedUpdates)
	pausedUpdatesRef.current = pausedUpdates

	const bottomTriggerRef = React.useRef(bottomTrigger)
	bottomTriggerRef.current = bottomTrigger

	const setPausedUpdatesRef = React.useRef(setPausedUpdates)
	setPausedUpdatesRef.current = setPausedUpdates

	const handleOnNewMessage = React.useCallback(() => {
		if (!timelineRef.current || pausedUpdatesRef.current) {
			return
		}

		if (!scrollableToBottomRef.current) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					timelineRef.current?.scrollTo(0, 0)
				})
			})
		}
	}, [])

	const bottomDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)

	const handleOnScroll = React.useCallback(() => {
		if (!timelineRef.current) return
		const scrollPosition = Math.abs(timelineRef.current.scrollTop)
		const isOnBottom = scrollPosition < 100

		// wait until the scroll settles to avoid layout shifts from loading skeleton
		if (isOnBottom) {
			if (bottomDebounceRef.current) {
				clearTimeout(bottomDebounceRef.current)
			}
			bottomDebounceRef.current = setTimeout(() => {
				bottomTriggerRef.current(true)
			}, 300)
		} else {
			if (bottomDebounceRef.current) {
				clearTimeout(bottomDebounceRef.current)
				bottomDebounceRef.current = null
			}
			// reset the trigger so it can fire again when user returns to bottom
			bottomTriggerRef.current(false)
		}

		// only manage button visibility here, dont toggle pausedUpdates
		// pausedUpdates should only change when user explicitly clicks "go to bottom"
		if (isOnBottom) {
			if (scrollableToBottomRef.current) {
				setScrollableToBottom(false)
			}
		} else {
			if (!scrollableToBottomRef.current) {
				setScrollableToBottom(true)
			}
		}
	}, [setScrollableToBottom])

	React.useEffect(() => {
		if (initialLoading) {
			return
		}

		const currentRef = timelineRef.current
		if (currentRef) {
			currentRef.addEventListener("scroll", handleOnScroll)
		}

		return () => {
			if (currentRef) {
				currentRef.removeEventListener("scroll", handleOnScroll)
			}

			if (bottomDebounceRef.current) {
				clearTimeout(bottomDebounceRef.current)
			}
		}
	}, [initialLoading, handleOnScroll])

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
	const isUsersTypingOverflowing = (usersTyping?.length ?? 0) > 3

	const usernamesTyping = trimmedUsersTyping.reduce((str, user) => {
		return `${str} ${user.username},`
	}, "")

	return (
		<div
			className="channel-chat"
			data-is-dm={type === "dm"}
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
								style={
									{
										"--items": trimmedUsersTyping.length,
									} as React.CSSProperties
								}
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
									{usernamesTyping} {isUsersTypingOverflowing && "and more,"}{" "}
									are typing...
								</span>
							</motion.div>
						)}
					</AnimatePresence>

					{timeline.map((item, index) => {
						const headless = shouldMergeWithNextItem(timeline[index + 1], item)

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
						{loading && <Skeleton avatar />}
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
									<Icons.ArrowDownToLine /> Go to recent messages
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

export default Chat
