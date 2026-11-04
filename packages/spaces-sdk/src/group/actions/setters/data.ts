import type SettersActions from "./index"

import { cacheGroup } from "@/helpers/cache"
import logger from "@comty/shared/utils/logger"

export default function (this: SettersActions, data: any): void {
	if (!data) {
		this.setState({ data: null })
		return
	}

	this.setState((state) => ({
		data:
			state.data && state.data._id === data._id
				? { ...state.data, ...data }
				: data,
	}))

	cacheGroup(data).catch(logger.error)
}
