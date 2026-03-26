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
import voiceChannelStated, {
	VoiceChannelStartedPayload,
} from "./voiceChannelStated"
import { EventsUpdaters } from ".."
import membershipCreated, {
	MemberchipCreatedPayload,
} from "./membershipCreated"
import membershipDeleted, {
	MemberchipDeletedPayload,
} from "./membershipDeleted"

export default ({
	group_id,
	updaters,
}: {
	group_id: string
	updaters: EventsUpdaters
}) => {
	return {
		[`group:${group_id}:membership:created`]: (
			payload: MemberchipCreatedPayload,
		) => membershipCreated(group_id, updaters, payload),
		[`group:${group_id}:membership:deleted`]: (
			payload: MemberchipDeletedPayload,
		) => membershipDeleted(group_id, updaters, payload),

		[`group:${group_id}:vc:started`]: (
			payload: VoiceChannelStartedPayload,
		) => voiceChannelStated(group_id, updaters, payload),
		[`group:${group_id}:vc:ended`]: (payload: VoiceChannelEndedPayload) =>
			voiceChannelEnd(group_id, updaters, payload),

		[`group:${group_id}:client:vc:join`]: (
			payload: ClientVoiceChannelJoinPayload,
		) => clientVoiceChannelJoin(group_id, updaters, payload),
		[`group:${group_id}:client:vc:left`]: (
			payload: ClientVoiceChannelLeftPayload,
		) => clientVoiceChannelLeft(group_id, updaters, payload),
		[`group:${group_id}:client:vc:event`]: (payload: ClientEventPayload) =>
			clientEvent(group_id, updaters, payload),

		[`group:${group_id}:client:vc:producer:open`]: (
			payload: ClientVoiceChannelProducerOpenPayload,
		) => clientVoiceChannelProducerOpen(group_id, updaters, payload),
		[`group:${group_id}:client:vc:producer:close`]: (
			payload: ClientVoiceChannelProducerClosePayload,
		) => clientVoiceChannelProducerClose(group_id, updaters, payload),

		[`group:${group_id}:user:online`]: (payload: UserOnlinePayload) =>
			userOnline(group_id, updaters, payload),
		[`group:${group_id}:user:offline`]: (payload: UserOfflinePayload) =>
			userOffline(group_id, updaters, payload),
	}
}
