import React from "react"
import { motion, AnimatePresence } from "motion/react"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import UsersModel from "@models/user"

import "./index.less"

const Client = React.memo(({ userId }) => {
	if (!userId) {
		return null
	}

	const [loading, result, error] = app.cores.api.useRequest(UsersModel.data, {
		user_id: userId,
		basic: true,
	})

	if (loading || error || !result) {
		return null
	}

	return (
		<div className="group-page__channels-panel__list-item__clients__client">
			<img
				src={result.avatar}
				alt={result.username}
			/>
			<p>{result.public_name ?? result.username}</p>
		</div>
	)
})

const ChannelsListItem = (props) => {
	const { channel, invalid, selected, handleOnClick } = props

	const isEmpty = !channel.clients || channel.clients.length === 0

	return (
		<div
			className={classnames("group-page__channels-panel__list-item", {
				["invalid"]: invalid,
				["selected"]: selected,
			})}
		>
			<div
				className="group-page__channels-panel__list-item__content bg-accent"
				onClick={handleOnClick}
			>
				<div className="group-page__channels-panel__list-item__content__icon">
					{channel.kind === "voice" && <Icons.Volume2 />}
					{channel.kind === "chat" && <Icons.MessageSquare />}
				</div>

				<div className="group-page__channels-panel__list-item__content__info">
					<div className="group-page__channels-panel__list-item__content__info__name">
						<p>{channel.name}</p>
					</div>

					{channel.description && (
						<div className="group-page__channels-panel__list-item__content__info__description">
							<span>{channel.description}</span>
						</div>
					)}
				</div>
			</div>

			<AnimatePresence initial={false}>
				{!isEmpty && (
					<motion.div
						key={`clients-list-${channel._id}`}
						className="group-page__channels-panel__list-item__clients bg-accent"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						style={{ overflow: "hidden" }}
					>
						{channel.clients.map((client) => {
							return (
								<Client
									key={client.userId}
									userId={client.userId}
								/>
							)
						})}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default ChannelsListItem
