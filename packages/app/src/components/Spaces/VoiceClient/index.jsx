import React from "react"
import { motion } from "motion/react"

import classnames from "classnames"
import { Icons } from "@components/Icons"

import ClientContextMenu from "./menu-context"

import "./index.less"

const VoiceClient = ({ client, speaking, producers }) => {
	const [soundpadIcon, setSoundpadIcon] = React.useState(null)
	const soundpadIconClearTimeout = React.useRef(null)

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
					target: event.target,
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
		[client.userId],
	)

	const isProducingScreen = React.useCallback(() => {
		return producers.some(
			(producer) => producer.appData.mediaTag === "screen-video",
		)
	}, [producers])

	const handleSoundpadDispatched = React.useCallback(
		(payload) => {
			if (!payload) {
				return null
			}

			if (payload?.userId !== client?.userId) {
				return null
			}

			if (soundpadIconClearTimeout.current) {
				clearTimeout(soundpadIconClearTimeout.current)
			}

			setSoundpadIcon(payload?.icon)

			soundpadIconClearTimeout.current = setTimeout(() => {
				setSoundpadIcon(null)
			}, 5000)
		},
		[client],
	)

	React.useEffect(() => {
		if (client && client?.userId) {
			app.eventBus.on(
				`rtc:vc:soundpad:${client.userId}`,
				handleSoundpadDispatched,
			)
		}

		return () => {
			if (client && client?.userId) {
				app.eventBus.off(
					`rtc:vc:soundpad:${client.userId}`,
					handleSoundpadDispatched,
				)
			}
		}
	}, [client])

	if (!client || !client?.userId) {
		return null
	}

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
					deafen: client.voiceState?.deafen,
					failed: false,
				},
			)}
			transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
		>
			{soundpadIcon && (
				<div className="group-page__channels-panel__list-item__clients__client__soundpad-icon">
					<p>{soundpadIcon}</p>
				</div>
			)}
			<div className="group-page__channels-panel__list-item__clients__client__avatar">
				<img
					src={client.user?.avatar}
					alt={client.user?.username}
				/>
			</div>

			<p>{client.user?.public_name ?? client.user?.username}</p>

			<div className="group-page__channels-panel__list-item__clients__client__indicators">
				{isProducingScreen() && <Icons.Monitor />}

				{client?.voiceState?.muted && (
					<Icons.MicOff style={{ color: "var(--danger-color)" }} />
				)}

				{client?.voiceState?.deafen && (
					<Icons.VolumeOff style={{ color: "var(--danger-color)" }} />
				)}
			</div>
		</motion.div>
	)
}

export default VoiceClient
