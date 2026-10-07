import type { GroupStoreType } from "../../types"
import ActionsBase from "@/classes/BaseActions"

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
