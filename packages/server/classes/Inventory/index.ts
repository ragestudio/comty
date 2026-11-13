import Bind from "@comty/shared/utils/bind"

import { KINDS, getItem, getItems, isKind } from "./catalogs"

import assertItemMethod from "./methods/assertItem"
import grantMethod from "./methods/grant"
import revokeMethod from "./methods/revoke"
import ownsMethod from "./methods/owns"
import listMethod from "./methods/list"
import hydrateDecorationsMethod from "./methods/hydrateDecorations"
import emitUserUpdateMethod from "./methods/emitUserUpdate"

export default class Inventory {
	static kinds = KINDS

	static isKind = isKind
	static getItem = getItem
	static getItems = getItems

	static assertItem = Bind(this, assertItemMethod)
	static grant = Bind(this, grantMethod)
	static revoke = Bind(this, revokeMethod)
	static owns = Bind(this, ownsMethod)
	static list = Bind(this, listMethod)
	static hydrateDecorations = Bind(this, hydrateDecorationsMethod)
	static emitUserUpdate = Bind(this, emitUserUpdateMethod)
}

export * from "./types"
