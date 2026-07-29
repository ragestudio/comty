import type { Group } from "../../collections/group"

import React from "react"
import GroupsModel from "@models/groups"

import { cacheGroup } from "../../helpers/cache"

export const useGroupData = (group_id: string) => {
	const [data, setData] = React.useState<Group>(null as any)

	const fetchGroup = React.useCallback(async () => {
		const res = await GroupsModel.get(group_id)

		setData(res)
		await cacheGroup(res)

		return res
	}, [group_id])

	return { data, setData, fetchGroup }
}
