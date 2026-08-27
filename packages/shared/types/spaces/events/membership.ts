import type { Member } from "../member"

export interface SpacesMembershipOutboundEvents {
	"membership:created": Member
	"membership:deleted": { group_id: string; user_id: string }
}
