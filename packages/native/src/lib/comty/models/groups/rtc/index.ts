import * as v from "valibot"

import { Validate } from "../../../decorators/Validate"
import { Definition } from "../../../decorators/Definition"

import Model from "../../../model"

class GroupRTC extends Model {
	/**
	 * Get the state of a group RTC
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "GET",
		url: `/rtc/groups/${group_id}/state`,
	}))
	getGroupState!: (group_id: string) => Promise<any>
}

export default new GroupRTC()
