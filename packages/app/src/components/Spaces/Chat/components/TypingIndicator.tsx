import React from "react"
import { AnimatePresence, motion } from "motion/react"

import { useChatTypingUsers } from "@comty/spaces-sdk/chat"

const TypingIndicator = () => {
	const users = useChatTypingUsers()
	const trimmedUsers = users?.slice(0, 3) ?? []
	const isOverflowing = (users?.length ?? 0) > 3

	const usernames = trimmedUsers
		.map((user) => user.username ?? user.public_name ?? "someone")
		.join(", ")

	return (
		<AnimatePresence mode="sync">
			{users?.length > 0 && (
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
							"--items": trimmedUsers.length,
						} as React.CSSProperties
					}
				>
					<div className="channel-chat__timeline__typers__images">
						{trimmedUsers.map((user, index) => (
							<img
								key={user._id ?? user.id ?? index}
								src={user.avatar}
								alt={user.username}
							/>
						))}
					</div>

					<span>
						{usernames}
						{isOverflowing && ", and more"} are typing...
					</span>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default TypingIndicator
