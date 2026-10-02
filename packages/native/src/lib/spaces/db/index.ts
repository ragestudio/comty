import { DexieCompat } from "./wrapper/compat"
import type { EntityTable } from "./wrapper/types"

import type { User } from "@comty/shared/types/user"
import type { Group } from "@comty/shared/types/spaces/group"
import type { Channels } from "@comty/shared/types/spaces/channel"
import type { Member } from "@comty/shared/types/spaces/member"
import type { Message } from "@comty/shared/types/spaces/message"
import type { ChatSyncState } from "../stores/chat/types"

type LastChannelsMessage = {
	channel_id: string
	_id: string
}

type MembersCounter = {
	group_id: string
	counter: number
}

export class SpacesDatabase extends DexieCompat {
	groups!: EntityTable<Group, "_id">
	channels!: EntityTable<Channels, "group_id">
	members!: EntityTable<Member, "_id">
	members_counter!: EntityTable<MembersCounter, "group_id">
	channel_messages!: EntityTable<Message, "_id">
	last_channels_message!: EntityTable<LastChannelsMessage, "channel_id">
	direct_messages!: EntityTable<Message, "_id">
	users!: EntityTable<User, "_id">
	chats_sync!: EntityTable<ChatSyncState, "chat_id">

	constructor() {
		super("spaces_store")

		this.version(5).stores({
			groups: "_id",
			channels: "group_id",
			members: "_id, group_id, [group_id+_id]",
			members_counter: "group_id",
			channel_messages: "_id, channel_id, [channel_id+_id]",
			last_channels_message: "channel_id",
			direct_messages: "_id, to_user_id, [to_user_id+_id]",
			users: "_id",
			chats_sync: "chat_id",
		})
	}
}

const db = new SpacesDatabase()

export default db
