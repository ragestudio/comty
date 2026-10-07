import type { AxiosRequestConfig } from "axios"

import Base from "./base"

export default class Model {
	constructor() {
		let currentProto = Object.getPrototypeOf(this)

		while (currentProto && currentProto !== Model.prototype) {
			const keys = Object.getOwnPropertyNames(currentProto)

			for (const key of keys) {
				if (key === "constructor") continue

				const descriptor = Object.getOwnPropertyDescriptor(
					currentProto,
					key,
				)

				if (descriptor && typeof descriptor.value === "function") {
					if (!Object.prototype.hasOwnProperty.call(this, key)) {
						;(this as any)[key] = descriptor.value.bind(this)
					}
				}
			}

			currentProto = Object.getPrototypeOf(currentProto)
		}
	}

	get request() {
		return Base.instance
	}

	get instance() {
		return Base.instance
	}

	definition<ReturnType = any>() {
		return <Args extends any[]>(
			definitionFn: (...args: Args) => AxiosRequestConfig,
		): ((...args: Args) => Promise<ReturnType>) => {
			return async (...args: Args): Promise<ReturnType> => {
				const requestConfig = definitionFn.call(this, ...args)
				const res = await Base.instance.request(requestConfig)

				return res.data
			}
		}
	}
}
