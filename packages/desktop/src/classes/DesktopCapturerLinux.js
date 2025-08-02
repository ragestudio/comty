import isChildProcess from "../utils/unixIsChildProcess.js"
import { session, desktopCapturer } from "electron"

export default class DesktopCapturerLinux {
	constructor(main) {
		this.main = main

		console.log("Starting DesktopCapturer module [linux]")

		this.pulseaudio = this.main.modules.get("pulseaudio")
		this.pipewire = this.main.modules.get("pipewire")

		if (!this.pulseaudio) {
			throw new Error(
				"pulseaudio module not found, needed for DesktopCapturer",
			)
		}

		if (!this.pipewire) {
			throw new Error(
				"pipewire module not found, needed for DesktopCapturer",
			)
		}

		// set the default session handler
		session.defaultSession.setDisplayMediaRequestHandler(
			async (request, callback) => {
				const sources = await desktopCapturer.getSources({
					types: ["screen"],
				})

				const obj = {
					video: sources[0],
				}

				callback(obj)
			},
			{ useSystemPicker: true },
		)
	}

	static deviceName = "comty-desktop_loopback"
	static remapperName = "comty-desktop_loopback_foward"

	defaultSinkName = null
	audioLoopback = null
	audioRemap = null

	syncDebounce = null

	async initialize() {
		try {
			// clear audio devices
			await this.clearAppDevices()

			// set the default sink name
			this.defaultSinkName = await this.pulseaudio.getDefaultSink()

			// create a sink
			await this.pulseaudio.createVirtualDuplexNode(
				DesktopCapturerLinux.deviceName,
			)

			// create a remapper
			await this.pulseaudio.createRemapper(
				DesktopCapturerLinux.remapperName,
				DesktopCapturerLinux.deviceName + ".monitor",
			)

			// fetch the loopback node & remapper
			this.audioLoopback = await this.pipewire.getNodeByName(
				DesktopCapturerLinux.deviceName,
			)
			this.audioRemap = await this.pipewire.getNodeByName(
				DesktopCapturerLinux.remapperName,
			)

			if (!this.audioLoopback) {
				throw new Error(
					"audioLoopback device not found, needed for DesktopCapturer",
				)
			}

			if (!this.audioRemap) {
				throw new Error(
					"audioRemap device not found, needed for DesktopCapturer",
				)
			}

			// filter only input ports
			this.audioLoopback.ports = this.audioLoopback.ports.filter(
				(port) => {
					return port.direction.toLowerCase() === "input"
				},
			)

			this.pulseaudio.eventBus.on("new", this.handleOnNewNodePulse)
			this.pulseaudio.eventBus.on("change", this.handleOnChangeNodePulse)

			// sync sources
			await this.syncSources()
		} catch (error) {
			console.error("Error initializing DesktopCapturer", error)
		}
	}

	syncSources = async () => {
		console.time("syncSources::")

		// get all linked sources
		const linkedSources = await this.pipewire.getLinkedAudioNodesOfSink(
			this.defaultSinkName,
		)

		console.log("linkedSources", linkedSources)

		// connect all sources to loopback device
		for await (const node of linkedSources) {
			try {
				const sinkInput =
					await this.pulseaudio.getSinkInputFromObjectId(
						node.id.toString(),
					)

				if (!sinkInput) {
					console.error(
						"Source is linked to default sink, but cannot find the sinkInput",
					)
					continue
				}

				if (!sinkInput.properties.application) {
					console.error(
						"Source is linked to default sink, but cannot find the sinkInput application",
					)
					continue
				}

				if (!sinkInput.properties.application.process) {
					console.error(
						"Source is linked to default sink, but cannot find the sinkInput application process",
					)
					continue
				}

				if (!sinkInput.properties.application.process.id) {
					console.error(
						"Source is linked to default sink, but cannot find the sinkInput application process id",
					)
					continue
				}

				const isChild = await isChildProcess(
					sinkInput.properties.application.process.id,
					process.pid,
				)

				if (isChild) {
					console.log(
						"Source is linked to default sink, but is a child process, so skipped.",
					)
					continue
				}

				// connect ports between sourceNode to loopbackNode
				await this.linkNodeToLoopback(node)
			} catch (error) {
				console.error("Error syncing source", error)
			}
		}

		console.timeEnd("syncSources::")
	}

	handleOnNewNodePulse = async (type, id) => {
		console.log("PulseAudio new::", { type, id })

		if (type === "sinkInput") {
			//await this.handlePulseClientId(id)
			//await this.syncSources()
		}
	}

	handleOnChangeNodePulse = async (type, id) => {
		console.log("PulseAudio change::", { type, id })

		if (type === "sinkInput") {
			if (this.syncDebounce) {
				clearTimeout(this.syncDebounce)
			}

			this.syncDebounce = setTimeout(this.syncSources, 500)
		}
	}

	handlePulseClientId = async (clientId) => {
		console.log("handlePulseClientId", clientId)

		const client = await this.pulseaudio.getClientByIndex(clientId)

		const isChild = await isChildProcess(
			client.properties.application.process.id,
			process.pid,
		)

		if (isChild) {
			console.log("The new pulse client is a child process, so skipped.")
			return false
		}

		console.log("paclient :", {
			object: client.properties.object,
			application: client.properties.application,
		})

		const node = await this.pipewire.getNodeById(
			client.properties.object.id,
		)

		if (!node) {
			console.error(
				"Client can be linked to the loopback node, but cannot find the pw node",
			)

			return false
		}

		console.log(node)

		await this.linkNodeToLoopback(node)
	}

	// TODO: check if is already linked
	linkNodeToLoopback = async (node) => {
		for await (const [index, port] of node.ports.entries()) {
			const originPortId = port.id
			const targetPortId = this.audioLoopback.ports[index].id

			console.log(`Linking pw port ${originPortId} -> ${targetPortId}`)

			await this.pipewire.linkPorts(targetPortId, originPortId)
		}
	}

	async clearAppDevices() {
		let sinks = await this.pulseaudio.getSinks()
		let sourceOutputs = await this.pulseaudio.getSourceOutputs()

		sinks = sinks.filter((sink) => {
			if (sink.name.startsWith(DesktopCapturerLinux.deviceName)) {
				return true
			}

			return false
		})

		sourceOutputs = sourceOutputs.filter((so) => {
			if (so.name.startsWith(DesktopCapturerLinux.deviceName)) {
				return true
			}

			return false
		})

		for (const sink of sinks) {
			await this.pulseaudio.unloadModuleByIndex(sink.moduleIndex)
			console.log("Killed sink", sink.name, sink.moduleIndex)
		}

		for (const loopback of sourceOutputs) {
			await this.pulseaudio.unloadModuleByIndex(loopback.moduleIndex)
			console.log(
				"Killed source output",
				loopback.name,
				loopback.moduleIndex,
			)
		}
	}

	destroy = async () => {
		await this.clearAppDevices()
	}
}
