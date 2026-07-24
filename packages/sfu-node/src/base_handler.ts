import type { IPCMsg } from "./ipc"

export default function (fn: Function) {
	return async function (data: any, msg: IPCMsg) {
		try {
			return await fn(data, msg)
		} catch (error) {
			console.error(error)
			msg.respond(null, error.message)
		}
	}
}
