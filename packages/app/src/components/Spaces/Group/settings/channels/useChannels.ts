import type { Channel } from "@comty/shared/types/spaces/channel"

import React from "react"

import GroupsModel from "@endpoints/groups"
import { useGroupActions, useGroupChannels } from "@comty/spaces-sdk/group"
import getErrorMessage from "@utils/getErrorMessage"

export const useChannels = (groupId?: string) => {
	const channels = useGroupChannels()
	const actions = useGroupActions()

	const create = React.useCallback(
		async (payload: { name: string; kind: Channel["kind"] }) => {
			if (!groupId) return

			try {
				const channel = await GroupsModel.channels.create(groupId, payload)

				actions.fetchChannels()

				return channel
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to create channel"))
				throw error
			}
		},
		[groupId, actions],
	)

	const update = React.useCallback(
		async (
			channelId: string,
			payload: {
				name?: string
				description?: string
				params?: Record<string, string>
			},
		) => {
			if (!groupId) return

			try {
				await GroupsModel.channels.channel.modify(groupId, channelId, payload)

				actions.fetchChannels()
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to update channel"))
				throw error
			}
		},
		[groupId, actions],
	)

	const remove = React.useCallback(
		async (channelId: string) => {
			if (!groupId) return

			try {
				await GroupsModel.channels.channel.delete(groupId, channelId)

				actions.fetchChannels()
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to delete channel"))
				throw error
			}
		},
		[groupId, actions],
	)

	const order = React.useCallback(
		async (items: Channel[]) => {
			if (!groupId) return

			const ids = items.map((channel) => channel._id)

			if (channels?.items) {
				actions.setChannels({ ...channels, items })
			}

			try {
				await GroupsModel.channels.order(groupId, ids)
			} catch (error) {
				app.message.error(getErrorMessage(error, "Failed to reorder channels"))
				actions.fetchChannels()
			}
		},
		[groupId, channels, actions],
	)

	return {
		channels,
		create,
		update,
		remove,
		order,
	}
}
