import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"
import type { PaginatedResponse } from "@comty/shared/types/pagination"

import * as v from "valibot"
import { Validate } from "../../../decorators/Validate"
import { Definition } from "../../../decorators/Definition"

import Model from "../../../model"

class GroupSoundpad extends Model {
	/**
	 * Get all soundpad items for a group
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "GET",
		url: `/groups/${group_id}/soundpad/items`,
	}))
	getItems!: (
		group_id: string,
	) => Promise<PaginatedResponse<SoundpadItemPayload>>

	/**
	 * Get a soundpad item by ID
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "item_id is required")),
	)
	@Definition((group_id, item_id) => ({
		method: "GET",
		url: `/groups/${group_id}/soundpad/items/${item_id}`,
	}))
	getItem!: (
		group_id: string,
		item_id: string,
	) => Promise<SoundpadItemPayload>
}

export default new GroupSoundpad()
