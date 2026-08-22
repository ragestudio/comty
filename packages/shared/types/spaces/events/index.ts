import type { SpacesChatOutboundEvents } from "./chat"
import type { SpacesGroupOutboundEvents } from "./group"
import type { SpacesMembershipOutboundEvents } from "./membership"
import type { SpacesPresenceOutboundEvents } from "./presence"

export type SpacesOutboundEvents = SpacesChatOutboundEvents &
	SpacesGroupOutboundEvents &
	SpacesMembershipOutboundEvents &
	SpacesPresenceOutboundEvents

export interface SpacesInboundEvents {}
