import ChildProcess from "node:child_process"
import createServiceLogTransformer from "./createServiceLogTransformer"

import Vars from "../vars"

export default async ({ id, service, cwd, onClose, onError, onIPCData }) => {
	const instanceEnv = {
		...process.env,
		lb_service: {
			id: service.id,
			index: service.index,
		},
	}

	let instance = ChildProcess.fork(Vars.bootloaderBin, [service], {
		detached: false,
		silent: true,
		cwd: cwd,
		env: instanceEnv,
		killSignal: "SIGTERM",
	})

	instance.logs = {
		stdout: createServiceLogTransformer({ id }),
		stderr: createServiceLogTransformer({ id, color: "bgRed" }),
		attach: (withBuffer = false) => {
			instance.logs.stdout.pipe(process.stdout)
			instance.logs.stderr.pipe(process.stderr)
		},
		detach: (withBuffer = false) => {
			instance.logs.stdout.unpipe(process.stdout)
			instance.logs.stderr.unpipe(process.stderr)
		},
	}

	// push to buffer history
	instance.stdout.pipe(instance.logs.stdout)
	instance.stderr.pipe(instance.logs.stderr)

	instance.on("message", (data) => {
		return onIPCData(id, data)
	})

	instance.on("error", (err) => {
		return onError(id, err)
	})

	instance.on("close", (code) => {
		return onClose(id, code)
	})

	global.ipcRouter.register({ id, instance })

	return instance
}
