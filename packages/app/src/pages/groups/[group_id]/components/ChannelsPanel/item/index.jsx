import { motion, AnimatePresence } from "motion/react"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import UserAvatar from "@components/UserAvatar"

import "./index.less"

const ChannelsListItem = (props) => {
	const { channel, invalid, selected, handleOnClick } = props

	const isEmpty = channel.clients.length === 0

	return (
		<div
			className={classnames("group-page__channels-panel__list-item", {
				["invalid"]: invalid,
				["selected"]: selected,
			})}
			onClick={handleOnClick}
		>
			<div className="group-page__channels-panel__list-item__icon">
				{channel.kind === "voice" && <Icons.FiVolume1 />}
				{channel.kind === "chat" && <Icons.FiMessageSquare />}
			</div>

			<div className="group-page__channels-panel__list-item__info">
				<div className="group-page__channels-panel__list-item__info__name">
					<p>{channel.name}</p>
				</div>

				<div className="group-page__channels-panel__list-item__info__description">
					<span>{channel.description}</span>
				</div>

				<AnimatePresence>
					{!isEmpty && (
						<motion.div
							className={classnames(
								"group-page__channels-panel__list-item__info__clients",
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
									<div
										key={client.userId}
										id={client.userId}
										className="group-page__channels-panel__list-item__info__clients__client"
									>
										<UserAvatar user_id={client.userId} />
									</div>
								)
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}

export default ChannelsListItem
