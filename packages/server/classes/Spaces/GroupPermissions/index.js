import canPerformActionMethod from "./methods/canPerformAction"
import PermissionsEnum from "./enum"

export default class GroupPermissions {
	static enum = PermissionsEnum
	static canPerformAction = canPerformActionMethod.bind(this)
}
