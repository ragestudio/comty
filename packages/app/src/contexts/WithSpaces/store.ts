import { Dexie, type EntityTable } from "dexie"
import { Group } from "./collections/group"
import { Channels } from "./collections/channel"
import { Member, Members } from "./collections/member"

import { Message } from "./collections/message"
import { User } from "./collections/user"

type LastChannelsMessage = {
	channel_id: string
	_id: string
}

type MembersCounter = {
	group_id: string
	counter: number
}

type GroupEntitySyncTime = {
	group_id: string
	time: Date
}

const db = new Dexie("spaces_store") as Dexie & {
	groups: EntityTable<Group, "_id">

	channels: EntityTable<Channels, "group_id">
	channels_sync: EntityTable<GroupEntitySyncTime, "group_id">

	members: EntityTable<Member, "group_id">
	members_counter: EntityTable<MembersCounter, "group_id">
	members_sync: EntityTable<GroupEntitySyncTime, "group_id">

	channel_messages: EntityTable<Message, "_id">
	last_channels_message: EntityTable<LastChannelsMessage, "channel_id">

	direct_messages: EntityTable<Message, "_id">
	users: EntityTable<User, "_id">
}

db.version(1).stores({
	groups: "_id",

	channels: "group_id",
	channels_sync: "group_id",

	members: "_id, group_id, [group_id+_id]",
	members_counter: "group_id",
	members_sync: "group_id",

	channel_messages: "_id, channel_id, [channel_id+_id]",
	last_channels_message: "channel_id",

	direct_messages: "_id, to_user_id, [to_user_id+_id]",

	users: "_id",
})

export default db
