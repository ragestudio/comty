import type { SetGroupState, GetGroupState } from "./context"
import type {
	ClientVoiceJoinPayload,
	ClientVoiceLeftPayload,
	ClientEventPayload,
	ProducerOpenPayload,
	ProducerClosePayload,
} from "../types"
import type { Client } from "@comty/shared/types/rtc/client"

const getCurrentUserId = (): string | undefined => window.app?.userData?._id

export const createVoiceEvents = (set: SetGroupState, get: GetGroupState) => ({
	handleVoiceChannelStarted: (payload: {
		channelId: string
		started_at?: string
	}) => {
		set((state) => {
			const existing = state.statedChannels[payload.channelId]
			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						_id: payload.channelId,
						clients: existing?.clients ?? [],
						producers: existing?.producers ?? [],
						started_at: payload.started_at,
					},
				},
			}
		})
	},

	handleVoiceChannelEnded: (payload: { channelId: string }) => {
		set((state) => {
			const { [payload.channelId]: _removed, ...rest } =
				state.statedChannels
			return { statedChannels: rest }
		})
	},

	handleClientVoiceJoin: (payload: ClientVoiceJoinPayload) => {
		set((state) => {
			const channel = state.statedChannels[payload.channelId] ?? {
				_id: payload.channelId,
				clients: [],
				producers: [],
			}

			if (channel.clients.some((c) => c.userId === payload.userId)) {
				return state
			}

			const client: Client = {
				channel_id: payload.channelId,
				userId: payload.userId,
				user: payload.user,
				voiceState: payload.voiceState,
				self: payload.userId === getCurrentUserId(),
			}

			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						...channel,
						clients: [...channel.clients, client],
					},
				},
			}
		})
	},

	handleClientVoiceLeft: (payload: ClientVoiceLeftPayload) => {
		set((state) => {
			const channel = state.statedChannels[payload.channelId]
			if (!channel) return state

			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						...channel,
						clients: channel.clients.filter(
							(c) => c.userId !== payload.userId,
						),
					},
				},
			}
		})
	},

	handleClientEvent: (payload: ClientEventPayload) => {
		if (payload.event !== "updateVoiceState") return

		set((state) => {
			const channel = state.statedChannels[payload.channelId]
			if (!channel) return state

			const clientIndex = channel.clients.findIndex(
				(c) => c.userId === payload.userId,
			)
			if (clientIndex === -1) return state

			const updatedClient = {
				...channel.clients[clientIndex],
				voiceState: {
					...channel.clients[clientIndex].voiceState,
					...payload.data,
				},
			}

			const newClients = [...channel.clients]
			newClients[clientIndex] = updatedClient

			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						...channel,
						clients: newClients,
					},
				},
			}
		})
	},

	handleProducerOpen: (payload: ProducerOpenPayload) => {
		set((state) => {
			const channel = state.statedChannels[payload.channelId] ?? {
				_id: payload.channelId,
				clients: [],
				producers: [],
			}

			if (
				channel.producers?.some(
					(p: any) => p.producerId === payload.producer.producerId,
				)
			) {
				return state
			}

			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						...channel,
						producers: [
							...(channel.producers ?? []),
							payload.producer,
						],
					},
				},
			}
		})
	},

	handleProducerClose: (payload: ProducerClosePayload) => {
		set((state) => {
			const channel = state.statedChannels[payload.channelId]
			if (!channel) return state

			return {
				statedChannels: {
					...state.statedChannels,
					[payload.channelId]: {
						...channel,
						producers: (channel.producers ?? []).filter(
							(p: any) => p.id !== payload.producer.id,
						),
					},
				},
			}
		})
	},
})
