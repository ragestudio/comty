import type { GroupStoreType } from "../../../stores/group/types"
import ActionsBase from "../../base"

import evaluateConnections from "./connections"
import evaluateDecorations from "./decorations"
import evaluateRTC from "./rtc"

class EvaluateActions extends ActionsBase<GroupStoreType> {
	evaluateConnections: OmitThisParameter<typeof evaluateConnections> =
		evaluateConnections.bind(this)
	evaluateDecorations: OmitThisParameter<typeof evaluateDecorations> =
		evaluateDecorations.bind(this)
	evaluateRTC: OmitThisParameter<typeof evaluateRTC> = evaluateRTC.bind(this)
}

export default EvaluateActions
