import { Dexie, type EntityTable } from "dexie"
import { Group } from "./collections/group"
import { Channels } from "./collections/channel"
import { Members } from "./collections/member"
import { Message } from "./collections/message"

const db = new Dexie("spaces_store") as Dexie & {
	groups: EntityTable<Group, "_id">
	channels: EntityTable<Channels, "group_id">
	members: EntityTable<Members, "group_id">
}

db.version(3).stores({
	groups: "_id",
	channels: "group_id",
	members: "group_id",
})

// // cleanup old cache entries (older than 7 days)
// const cleanupOldCache = async () => {
// 	try {
// 		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

// 		await db.groups.where("cached_at").below(sevenDaysAgo).delete()
// 		await db.channels.where("cached_at").below(sevenDaysAgo).delete()
// 		await db.members.where("cached_at").below(sevenDaysAgo).delete()
// 	} catch (err) {
// 		console.error("Error cleaning up old cache:", err)
// 	}
// }

// // run cleanup occasionally
// setTimeout(cleanupOldCache, 1000)

export default db
