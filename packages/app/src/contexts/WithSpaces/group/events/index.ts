import { RefObject } from "react"
import { Group } from "../../collections/group"

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

export default ({
	group_id,
	group_data_ref,
	updaters,
}: {
	group_id: string
	group_data_ref: RefObject<Group>
	updaters: EventsUpdaters
}) => {
	return {
		[`group:${group_id}:vc:started`]: (
			payload: VoiceChannelStartedPayload,
		) => voiceChannelStated(group_data_ref.current, updaters, payload),
		[`group:${group_id}:vc:ended`]: (payload: VoiceChannelEndedPayload) =>
			voiceChannelEnd(group_data_ref.current, updaters, payload),

		[`group:${group_id}:client:vc:join`]: (
			payload: ClientVoiceChannelJoinPayload,
		) => clientVoiceChannelJoin(group_data_ref.current, updaters, payload),
		[`group:${group_id}:client:vc:left`]: (
			payload: ClientVoiceChannelLeftPayload,
		) => clientVoiceChannelLeft(group_data_ref.current, updaters, payload),
		[`group:${group_id}:client:vc:event`]: (payload: ClientEventPayload) =>
			clientEvent(group_data_ref.current, updaters, payload),

		[`group:${group_id}:client:vc:producer:open`]: (
			payload: ClientVoiceChannelProducerOpenPayload,
		) =>
			clientVoiceChannelProducerOpen(
				group_data_ref.current,
				updaters,
				payload,
			),
		[`group:${group_id}:client:vc:producer:close`]: (
			payload: ClientVoiceChannelProducerClosePayload,
		) =>
			clientVoiceChannelProducerClose(
				group_data_ref.current,
				updaters,
				payload,
			),

		[`group:${group_id}:user:online`]: (payload: UserOnlinePayload) =>
			userOnline(group_data_ref.current, updaters, payload),
		[`group:${group_id}:user:offline`]: (payload: UserOfflinePayload) =>
			userOffline(group_data_ref.current, updaters, payload),
	}
}
