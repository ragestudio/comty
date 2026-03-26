import { Dexie, type EntityTable } from "dexie"
import { Group } from "./collections/group"
import { Channel } from "./collections/channel"
import { Member } from "./collections/member"
import { Message } from "./collections/message"

const db = new Dexie("spaces_store") as Dexie & {
	groups: EntityTable<Group, "_id">
	channels: EntityTable<Channel, "_id">
	members: EntityTable<Member, "_id">
	messages: EntityTable<Message, "_id">
}

db.version(1).stores({
	groups: "_id",
	channels: "_id",
	members: "_id",
	messages: "_id",
})

export default db
