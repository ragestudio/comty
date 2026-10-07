import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"

import axios from "axios"
import session from "./session"

export class Base {
	static defaultApi = "https://api.comty.app"

	instance: AxiosInstance

	constructor() {
		this.instance = axios.create({
			baseURL: Base.defaultApi,
			headers: {
				"Content-Type": "application/json",
			},
		})

		this.instance.interceptors.request.use(
			this.requestInterceptorFullfilled,
			this.requestInterceptorRejected,
		)
	}

	private requestInterceptorFullfilled(config: InternalAxiosRequestConfig) {
		// check if current request has no Authorization header, if so, attach the token
		if (!config.headers["Authorization"]) {
			if (session.token) {
				config.headers["Authorization"] = `Bearer ${session.token}`
			}
		}

		return config
	}

	private requestInterceptorRejected(error: any) {}
}

export default new Base()
