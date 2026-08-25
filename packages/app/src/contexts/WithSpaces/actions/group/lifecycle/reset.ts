import type LifecycleActions from "./index"
import {
	createDefaultChannels,
	createDefaultMembers,
} from "../../../stores/group/constants"

export default function (this: LifecycleActions): void {
	this.setState((state) => ({
		initGeneration: state.initGeneration + 1,
		groupId: null,
		data: null,
		channels: createDefaultChannels(),
		members: createDefaultMembers(),
		statedChannels: {},
		connectedMembers: [],
		membersDecorations: {},
		loading: true,
		error: null,
	}))
}
