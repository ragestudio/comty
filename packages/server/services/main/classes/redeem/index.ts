import Bind from "@comty/shared/utils/bind"

import createCode from "./methods/createCode"
import preview from "./methods/preview"
import redeem from "./methods/redeem"
import listCodes from "./methods/listCodes"
import getCode from "./methods/getCode"
import disableCode from "./methods/disableCode"
import getRedemptions from "./methods/getRedemptions"

class Redeem {
	createCode = Bind(this, createCode)
	preview = Bind(this, preview)
	redeem = Bind(this, redeem)
	listCodes = Bind(this, listCodes)
	getCode = Bind(this, getCode)
	disableCode = Bind(this, disableCode)
	getRedemptions = Bind(this, getRedemptions)
}

export * from "./types"

export default new Redeem()
