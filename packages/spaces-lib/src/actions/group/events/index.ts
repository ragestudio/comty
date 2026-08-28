import type { GroupStoreType } from "../../../stores/group/types"
import ActionsBase from "../../base"

import groupUpdate from "./group/update"
import channelCreated from "./channels/created"
import channelDeleted from "./channels/deleted"
import channelUpdated from "./channels/updated"
import channelsOrdered from "./channels/ordered"
import channelNewMessage from "./channels/newMessage"
import membershipCreated from "./memberships/created"
import membershipDeleted from "./memberships/deleted"
import presenceOnline from "./presence/online"
import presenceOffline from "./presence/offline"
import voiceStarted from "./voice/started"
import voiceEnded from "./voice/ended"
import voiceClientJoin from "./voice/clientJoin"
import voiceClientLeft from "./voice/clientLeft"
import voiceClientEvent from "./voice/clientEvent"
import voiceProducerOpen from "./voice/producerOpen"
import voiceProducerClose from "./voice/producerClose"

class EventsActions extends ActionsBase<GroupStoreType> {
	handleGroupUpdate: OmitThisParameter<typeof groupUpdate> =
		groupUpdate.bind(this)
	handleChannelCreated: OmitThisParameter<typeof channelCreated> =
		channelCreated.bind(this)
	handleChannelDeleted: OmitThisParameter<typeof channelDeleted> =
		channelDeleted.bind(this)
	handleChannelUpdated: OmitThisParameter<typeof channelUpdated> =
		channelUpdated.bind(this)
	handleChannelsOrdered: OmitThisParameter<typeof channelsOrdered> =
		channelsOrdered.bind(this)
	handleChannelNewMessage: OmitThisParameter<typeof channelNewMessage> =
		channelNewMessage.bind(this)
	handleMembershipCreated: OmitThisParameter<typeof membershipCreated> =
		membershipCreated.bind(this)
	handleMembershipDeleted: OmitThisParameter<typeof membershipDeleted> =
		membershipDeleted.bind(this)
	handleUserOnline: OmitThisParameter<typeof presenceOnline> =
		presenceOnline.bind(this)
	handleUserOffline: OmitThisParameter<typeof presenceOffline> =
		presenceOffline.bind(this)
	handleVoiceChannelStarted: OmitThisParameter<typeof voiceStarted> =
		voiceStarted.bind(this)
	handleVoiceChannelEnded: OmitThisParameter<typeof voiceEnded> =
		voiceEnded.bind(this)
	handleClientVoiceJoin: OmitThisParameter<typeof voiceClientJoin> =
		voiceClientJoin.bind(this)
	handleClientVoiceLeft: OmitThisParameter<typeof voiceClientLeft> =
		voiceClientLeft.bind(this)
	handleClientEvent: OmitThisParameter<typeof voiceClientEvent> =
		voiceClientEvent.bind(this)
	handleProducerOpen: OmitThisParameter<typeof voiceProducerOpen> =
		voiceProducerOpen.bind(this)
	handleProducerClose: OmitThisParameter<typeof voiceProducerClose> =
		voiceProducerClose.bind(this)
}

export default EventsActions
