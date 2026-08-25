import ChatActionsBase from "../base"

import load from "./load"
import loadBefore from "./loadBefore"
import loadAfter from "./loadAfter"
import loadAround from "./loadAround"

class LoadActions extends ChatActionsBase {
	load: OmitThisParameter<typeof load> = load.bind(this)
	loadBefore: OmitThisParameter<typeof loadBefore> = loadBefore.bind(this)
	loadAfter: OmitThisParameter<typeof loadAfter> = loadAfter.bind(this)
	loadAround: OmitThisParameter<typeof loadAround> = loadAround.bind(this)
}

export default LoadActions
