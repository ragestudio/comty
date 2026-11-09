import type { Server } from "linebridge"
import type LiveDirectory from "live-directory"

export interface ComtyUser {
	user_id: string
	username: string
	description?: string
	avatar?: string
	[key: string]: unknown
}

export interface ComtyPost {
	post_id: string
	user?: ComtyUser
	message?: string
	[key: string]: unknown
}

export type WrapperFile = NonNullable<ReturnType<LiveDirectory["get"]>>

export interface WrapperRequestExtensions {
	indexHtml?: string
	file?: WrapperFile
}

export type WrapperRequest<T extends Server<any> = Server<any>> =
	ServerRequest<T> & WrapperRequestExtensions
