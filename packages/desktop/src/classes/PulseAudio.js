import PulseAudio from "paclient"

import fs from "node:fs"
import os from "node:os"
import child_process from "node:child_process"
import { EventEmitter } from "node:events"

export default class PulseAudioModule {
	constructor(main) {
		this.main = main
	}

	static defaultSocket = "/run/user/1000/pulse/native"
	static defaultCookiePath = os.homedir() + "/.config/pulse/cookie"

	eventBus = new EventEmitter()

	client = null

	async connect() {
		await new Promise((resolve) => {
			this.client.on("ready", resolve)

			this.client.connect({
				path: PulseAudioModule.defaultSocket,
				cookie: fs.readFileSync(PulseAudioModule.defaultCookiePath),
			})
		})
	}

	async exec(cmd, ...args) {
		return new Promise((resolve, reject) => {
			const _args = [
				...args,
				(err, data) => {
					if (err) {
						return reject(err)
					}

					return resolve(data)
				},
			]

			this.client[cmd](..._args)
		})
	}

	getSinks = () => {
		return this.exec("getSinks")
	}

	getSources = () => {
		return this.exec("getSources")
	}

	getSourceOutputs = () => {
		return this.exec("getSourceOutputs")
	}

	getSourceInputs = () => {
		return this.exec("getSourceInputs")
	}

	getSinkInputs = () => {
		return this.exec("getSinkInputs")
	}

	getModules = () => {
		return this.exec("getModules")
	}

	getClientByIndex = async (index) => {
		return await this.exec("getClientByIndex", index)
	}

	getSinkInputFromObjectId = async (objectId) => {
		const clients = await this.exec("getSinkInputs")

		return clients.find((client) => {
			return client.properties.object.id === objectId
		})
	}

	killSinkInputByIndex = (index) => {
		return this.exec(`killSinkInputByIndex`, index)
	}

	moveSinkInput = (sinkInputIndex, sinkIndex) => {
		return this.exec("moveSinkInput", sinkInputIndex, sinkIndex)
	}

	setDefaultSink = (sinkName) => {
		return new Promise((resolve, reject) => {
			const args = ["pactl", "set-default-sink", sinkName]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve(stdout)
			})
		})
	}

	getDefaultSink = () => {
		return new Promise((resolve, reject) => {
			const args = ["pactl", "get-default-sink"]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve(stdout.trim())
			})
		})
	}

	unloadModuleByIndex = (index) => {
		return new Promise((resolve, reject) => {
			const args = ["pactl", "unload-module", index]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve(stdout)
			})
		})
	}

	createSink = (name, properties) => {
		return new Promise((resolve, reject) => {
			const args = [
				"pactl",
				"load-module",
				"module-null-sink",
				`sink_name=${name}`,
				`sink_properties=device.description=${name}`,
			]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve({
					name: name,
					id: stdout.trim(),
				})
			})
		})
	}

	createRemapper = (name, from) => {
		return new Promise((resolve, reject) => {
			const args = [
				"pactl",
				"load-module",
				"module-remap-source",
				`master=${from}`,
				`source_name=${name}`,
				`source_properties=device.description=${name}`,
			]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve({
					name: name,
					id: stdout.trim(),
				})
			})
		})
	}

	createLoopback = (name, source, sink) => {
		return new Promise((resolve, reject) => {
			const args = [
				"pactl",
				"load-module",
				"module-loopback",
				`name=${name}`,
				`source=${source}`,
				`sink=${sink}`,
				`sink_properties=device.description=${name}`,
				`source_properties=device.description=${name}`,
				"source_dont_move=1",
			]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				console.log(stdout)
				resolve({
					name: name,
					id: stdout.trim(),
				})
			})
		})
	}

	createVirtualDuplexNode = (name) => {
		return new Promise((resolve, reject) => {
			const args = [
				"pactl",
				"load-module",
				"module-null-sink",
				"media.class=Audio/Duplex",
				`sink_name=${name}`,
				"audio.position=FL,FR,RL,RR",
				`source_properties=device.description=${name}`,
				`sink_properties=device.description=${name}`,
			]

			child_process.exec(args.join(" "), (error, stdout, stderr) => {
				if (error || stderr) {
					return reject(error || stderr)
				}

				resolve({
					name: name,
					id: stdout.trim(),
				})
			})
		})
	}

	async initialize() {
		console.log(
			"PulseAudioModule.initialize",
			PulseAudioModule.defaultSocket,
			process.getuid(),
		)

		this.client = new PulseAudio()

		this.client.on("error", (error) => {
			console.error("PulseAudio error", error)
		})

		await this.connect()

		await this.client.subscribe("all")

		this.client.on("new", (...args) => {
			this.eventBus.emit("new", ...args)
		})

		this.client.on("change", (...args) => {
			this.eventBus.emit("change", ...args)
		})

		this.client.on("remove", (...args) => {
			this.eventBus.emit("remove", ...args)
		})

		console.log("PulseAudio connected")
	}
}
