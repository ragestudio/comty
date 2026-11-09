import type { IncomingMessage, ServerResponse } from "node:http"

import type Main from "../../main.js"

export interface ApiRequest extends IncomingMessage {
	body: unknown
	params: Record<string, string>
}

export interface ApiResponse extends ServerResponse {
	_responseTimeMs?: number
	_status_code?: number
	status(code: number): ApiResponse
	json(data: unknown): void
}

export type ApiHandler = (
	req: ApiRequest,
	res: ApiResponse,
	main: Main,
) => unknown | Promise<unknown>

export interface ApiRoute {
	path: string
	method: string
	handler: ApiHandler
	such?: string
}
