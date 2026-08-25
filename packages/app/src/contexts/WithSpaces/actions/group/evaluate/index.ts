import GroupActionsBase from "../base"

import evaluateConnections from "./connections"
import evaluateDecorations from "./decorations"
import evaluateRTC from "./rtc"

class EvaluateActions extends GroupActionsBase {
	evaluateConnections: OmitThisParameter<typeof evaluateConnections> =
		evaluateConnections.bind(this)
	evaluateDecorations: OmitThisParameter<typeof evaluateDecorations> =
		evaluateDecorations.bind(this)
	evaluateRTC: OmitThisParameter<typeof evaluateRTC> = evaluateRTC.bind(this)
}

export default EvaluateActions
