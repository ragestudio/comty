import clientEvent, { ClientEventPayload } from "./clientEvent"
import clientVoiceChannelJoin, {
	ClientVoiceChannelJoinPayload,
} from "./clientVoiceChannelJoin"
import clientVoiceChannelLeft, {
	ClientVoiceChannelLeftPayload,
} from "./clientVoiceChannelLeft"
import clientVoiceChannelProducerClose, {
	ClientVoiceChannelProducerClosePayload,
} from "./clientVoiceChannelProducerClose"
import clientVoiceChannelProducerOpen, {
	ClientVoiceChannelProducerOpenPayload,
} from "./clientVoiceChannelProducerOpen"
import userOffline, { UserOfflinePayload } from "./userOffline"
import userOnline, { UserOnlinePayload } from "./userOnline"
import voiceChannelEnd, { VoiceChannelEndedPayload } from "./voiceChannelEnd"
import voiceChannelStarted, {
	VoiceChannelStartedPayload,
} from "./voiceChannelStarted"
import { EventsUpdaters } from ".."
import membershipCreated, {
	MemberchipCreatedPayload,
} from "./membershipCreated"
import membershipDeleted, {
	MemberchipDeletedPayload,
} from "./membershipDeleted"
import groupUpdate from "./groupUpdate"
import channelCreated from "./channelCreated"
import channelDeleted from "./channelDeleted"
import channelUpdated from "./channelUpdated"
import channelsOrdered from "./channelsOrdered"
import channelNewMessage from "./channelNewMessage"
import channelDeletedMessage from "./channelDeletedMessage"

export default ({
	group_id,
	updaters,
}: {
	group_id: string
	updaters: EventsUpdaters
}) => {
	const groupTopicPrefix = `group:${group_id}`

	return {
		//
		// Group events
		//
		[`${groupTopicPrefix}:update`]: (payload: any) =>
			groupUpdate(group_id, updaters, payload),

		//
		// Channels Events
		//
		[`${groupTopicPrefix}:channel:created`]: (payload: any) =>
			channelCreated(group_id, updaters, payload),
		[`${groupTopicPrefix}:channel:deleted`]: (payload: any) =>
			channelDeleted(group_id, updaters, payload),
		[`${groupTopicPrefix}:channel:updated`]: (payload: any) =>
			channelUpdated(group_id, updaters, payload),
		[`${groupTopicPrefix}:channels:ordered`]: (payload: any) =>
			channelsOrdered(group_id, updaters, payload),

		[`${groupTopicPrefix}:channels:new:message`]: (payload: any) =>
			channelNewMessage(group_id, updaters, payload),
		[`${groupTopicPrefix}:channels:deleted:message`]: (payload: any) =>
			channelDeletedMessage(group_id, updaters, payload),
		// [`${groupTopicPrefix}:channels:updated:message`]: (payload: any) =>
		//   channelNewMessage(group_id, updaters, payload),

		//
		// Memberships Events
		//
		[`${groupTopicPrefix}:membership:created`]: (
			payload: MemberchipCreatedPayload,
		) => membershipCreated(group_id, updaters, payload),
		[`${groupTopicPrefix}:membership:deleted`]: (
			payload: MemberchipDeletedPayload,
		) => membershipDeleted(group_id, updaters, payload),

		//
		// Voice Channels events
		//
		[`${groupTopicPrefix}:vc:started`]: (
			payload: VoiceChannelStartedPayload,
		) => voiceChannelStarted(group_id, updaters, payload),
		[`${groupTopicPrefix}:vc:ended`]: (payload: VoiceChannelEndedPayload) =>
			voiceChannelEnd(group_id, updaters, payload),
		[`${groupTopicPrefix}:client:vc:join`]: (
			payload: ClientVoiceChannelJoinPayload,
		) => clientVoiceChannelJoin(group_id, updaters, payload),
		[`${groupTopicPrefix}:client:vc:left`]: (
			payload: ClientVoiceChannelLeftPayload,
		) => clientVoiceChannelLeft(group_id, updaters, payload),
		[`${groupTopicPrefix}:client:vc:event`]: (
			payload: ClientEventPayload,
		) => clientEvent(group_id, updaters, payload),
		[`${groupTopicPrefix}:client:vc:producer:open`]: (
			payload: ClientVoiceChannelProducerOpenPayload,
		) => clientVoiceChannelProducerOpen(group_id, updaters, payload),
		[`${groupTopicPrefix}:client:vc:producer:close`]: (
			payload: ClientVoiceChannelProducerClosePayload,
		) => clientVoiceChannelProducerClose(group_id, updaters, payload),

		//
		// Group users Events
		//
		[`${groupTopicPrefix}:user:online`]: (payload: UserOnlinePayload) =>
			userOnline(group_id, updaters, payload),
		[`${groupTopicPrefix}:user:offline`]: (payload: UserOfflinePayload) =>
			userOffline(group_id, updaters, payload),
	}
}
