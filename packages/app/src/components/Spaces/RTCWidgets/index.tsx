import React from "react"

import FloatingScreens from "@components/FloatingScreens"
import VoiceChannelCard from "@components/Spaces/VoiceChannelCard"

import { useRTCStore } from "@/rtc"
import { isChannelView, useSpacesNavigation } from "@/stores/spaces/navigation"
import { toolsBarStore } from "@/stores/toolsbar"

const VOICE_CHANNEL_RENDER_ID = "mediartc-channel"
const FLOATING_SCREENS_RENDER_ID = "mediartc-floating-screens"

const RTCWidgets = () => {
	const nav = useSpacesNavigation()

	const inChannel = useRTCStore((store) => store.state !== "disconnected")
	const channel = useRTCStore((store) => store.channel)
	const localScreenStream = useRTCStore((store) => store.localScreenStream)
	const statedScreens = useRTCStore((store) => store.statedScreens)

	const hasActiveScreen =
		!!localScreenStream ||
		(statedScreens ?? []).some(
			(screen) => screen.enabled && !!screen.stream,
		)

	// the channel view is visible when the navigation points to it
	const isViewingChannel = isChannelView(nav, channel)

	// attach the voice channel card app wide while connected
	React.useEffect(() => {
		if (!inChannel) return

		toolsBarStore
			.getState()
			.attachRender(
				VOICE_CHANNEL_RENDER_ID,
				VoiceChannelCard,
				undefined,
				{
					position: "bottom",
				},
			)

		return () => {
			toolsBarStore.getState().detachRender(VOICE_CHANNEL_RENDER_ID)
		}
	}, [inChannel])

	// show the live screen in the toolbar when the channel view is not visible
	React.useEffect(() => {
		if (!hasActiveScreen || isViewingChannel) return

		toolsBarStore
			.getState()
			.attachRender(
				FLOATING_SCREENS_RENDER_ID,
				FloatingScreens,
				undefined,
				{
					position: "top",
				},
			)

		return () => {
			toolsBarStore.getState().detachRender(FLOATING_SCREENS_RENDER_ID)
		}
	}, [hasActiveScreen, isViewingChannel])

	return null
}

export default RTCWidgets
