import type { Group } from "../group"

export interface SpacesGroupOutboundEvents {
    "group:update": Partial<Group>
    "group:channels:ordered": { ordered_channels: string[] }

    "channel:created": { group_id: string; channel: any }
    "channel:deleted": { group_id: string; channel_id: string }
    "channel:updated": { group_id: string; channel: any }
}
