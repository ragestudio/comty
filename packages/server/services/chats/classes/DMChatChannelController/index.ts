import mongoose from "mongoose"
// @ts-ignore
import { User } from "@db_models"

import DMChatChannel from "./instance"

import ActivityModel from "@db/direct_messages_activity"
import RoomsModel from "@db/direct_messages_rooms"

export function genPairKey(id1, id2) {
	return [id1, id2].sort().join("-")
}

// TODO: extend RoomsModel and ActivityModel into one type
type ExtendedDataRoom = typeof RoomsModel.schema.fields &
	typeof ActivityModel.schema.fields

export default class DMChatChannelController {
	constructor(server) {
		this.server = server
	}

	server: any

	get snowflake() {
		return this.server.contexts.snowflake
	}

	get = async (from_user_id, to_user_id) => {
		if (typeof from_user_id !== "string") {
			throw new OperationError(400, "from_user_id must be a string")
		}

		if (typeof to_user_id !== "string") {
			throw new OperationError(400, "to_user_id must be a string")
		}

		// create the sorted pairkey
		const pair_key = genPairKey(from_user_id, to_user_id)

		// search by pairkey
		let room = await RoomsModel.findOne({
			pair_key: pair_key,
		})

		// if the room doesn't exist, create it
		if (!room) {
			// console.debug(
			// 	`Creating direct message room with pair key [${pair_key}]`,
			// )

			const room_id = this.snowflake.nextId().toString()
			const created_at = new Date()

			room = RoomsModel.obj({
				_id: room_id,
				pair_key: pair_key,
				created_at: created_at,
			})

			await room.save()
		}

		// just return the room instance
		return new DMChatChannel(this, room.toRaw())
	}

	// TODO: implement pagination
	rooms = async (userId, { limit = 20, offset = 0 } = {}) => {
		let activity = await ActivityModel.find(
			{
				user_id: userId,
				$limit: limit,
			},
			{
				raw: true,
			},
		)

		if (activity.length === 0) {
			return []
		}

		const pairs = activity.map((reg) =>
			genPairKey(reg.user_id, reg.to_user_id),
		)

		const users = new Map()

		// filter invalid user_ids (must be objectId)
		activity = activity.filter((reg) => {
			if (
				reg.to_user_id &&
				!mongoose.Types.ObjectId.isValid(reg.to_user_id)
			) {
				return false
			}

			return true
		})

		// if there are any activities, fetch the users
		if (activity.length > 0) {
			const data = await User.find({
				_id: {
					$in: activity.map((a) => a.to_user_id),
				},
			}).catch((err) => {
				console.error(err)
				return []
			})

			for (const user of data) {
				users.set(user._id.toString(), user)
			}
		}

		let rooms = (await RoomsModel.find(
			{
				pair_key: {
					$in: pairs,
				},
			},
			{
				raw: true,
			},
		)) as ExtendedDataRoom[]

		// insert last message_at & sort
		rooms = rooms.map((room) => {
			const activityRef = activity.find((a) => a.room_id === room._id)

			if (!activityRef) {
				return null
			}

			room.last_message_at = activityRef.last_message_at
			room.to_user_id = activityRef.to_user_id

			room.short_message = activityRef.short_message
			room.direction = activityRef.direction
			room.user = users.get(room.to_user_id)

			return room
		})

		rooms = rooms.filter((room) => room !== null)

		rooms = rooms.sort((a, b) => {
			return b.last_message_at - a.last_message_at
		})

		return rooms
	}
}
