import { motion, AnimatePresence } from "motion/react"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import UserAvatar from "@components/UserAvatar"

import UsersModel from "@models/user"
import use from "comty.js/hooks/use"

import "./index.less"

const Client = ({ userId }) => {
	if (!userId) {
		return null
	}

	const [loading, result, error] = app.cores.api.useRequest(UsersModel.data, {
		user_id: userId,
		basic: true,
	})

	if (loading) {
		return null
	}

	return (
		<div className="group-page__channels-panel__list-item__clients__client">
			<img
				src={result.avatar}
				alt={result.username}
			/>
			<p>{userId}</p>
			<p>{result.public_name ?? result.username}</p>
		</div>
	)
}

const ChannelsListItem = (props) => {
	const { channel, invalid, selected, handleOnClick } = props

	const isEmpty = channel.clients.length === 0

	return (
		<AnimatePresence>
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

				{!isEmpty && (
					<motion.div
						className={classnames(
							"group-page__channels-panel__list-item__clients bg-accent",
						)}
						animate={{
							height: "100%",
						}}
						exit={{
							height: 0,
						}}
					>
						{channel.clients.map((client) => {
							return (
								<Client
									id={client.userId}
									userId={client.userId}
								/>
							)
						})}
					</motion.div>
				)}
			</div>
		</AnimatePresence>
	)
}

export default ChannelsListItem
