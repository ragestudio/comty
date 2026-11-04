import type { GroupBan as base } from "@comty/shared/db/group_bans"
import type { User } from "../user"

export interface GroupBan extends Omit<base, "created_at"> {
	created_at?: string | Date
	user?: User
}
