import React from "react"
import { motion } from "motion/react"

import classnames from "classnames"
import { Icons } from "@components/Icons"

import ClientContextMenu from "./menu-context"

import "./index.less"

const VoiceClient = ({ client, speaking, producers }) => {
	if (!client || !client?.userId) {
		return null
	}

	const onContextMenu = React.useCallback(
		(event) => {
			event.preventDefault()
			event.stopPropagation()

			const { x, y } = app.cores.ctx_menu.calculateFitCordinates(
				event,
				parseInt(
					app.cores.style.vars["context-menu-width"].replace(
						"px",
						"",
					),
				),
				300, // FIXME: calculate height properly
			)

			app.cores.ctx_menu.renderMenu(
				React.createElement(ClientContextMenu, {
					client: {
						...client,
						self: client.userId === app.userData._id,
					},
					close: app.cores.ctx_menu.close,
				}),
				x,
				y,
			)
		},
		[client],
	)

	const isProducingScreen = React.useCallback(() => {
		return producers.some(
			(producer) => producer.appData.mediaTag === "screen-video",
		)
	}, [producers])

	return (
		<motion.div
			id={client.userId}
			onClick={onContextMenu}
			onContextMenu={onContextMenu}
			initial={{ left: -100 }}
			exit={{ left: -100 }}
			animate={{ left: 0 }}
			className={classnames(
				"group-page__channels-panel__list-item__clients__client",
				{
					speaking: speaking,
					muted: client.voiceState?.muted,
					deafened: client.voiceState?.deafened,
					failed: false,
				},
			)}
			transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
		>
			<div className="group-page__channels-panel__list-item__clients__client__avatar">
				<img
					src={client.user?.avatar}
					alt={client.user?.username}
				/>
			</div>

			<p>{client.user?.public_name ?? client.user?.username}</p>

			{(client.voiceState?.muted || client.voiceState?.deafened) && (
				<div className="group-page__channels-panel__list-item__clients__client__indicators">
					{isProducingScreen() && <Icons.Monitor />}
					{/* {client.localState.muted && <Icons.MicOff />}
					{client.localState.deafened && <Icons.VolumeOff />}*/}
					{client.voiceState.muted && (
						<Icons.MicOff
							style={{ color: "var(--danger-color)" }}
						/>
					)}
					{client.voiceState.deafened && (
						<Icons.VolumeOff
							style={{ color: "var(--danger-color)" }}
						/>
					)}
				</div>
			)}
		</motion.div>
	)
}

export default VoiceClient
