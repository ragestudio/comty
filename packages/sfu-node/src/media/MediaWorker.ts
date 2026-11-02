import type { WebRtcServer, Worker } from "mediasoup/types"
import type { SfuConfig } from "../config"

import * as mediasoup from "mediasoup"

export type WorkerDiedHandler = () => void

export class MediaWorker {
	private constructor(
		readonly worker: Worker,
		readonly rtcServer: WebRtcServer,
	) {}

	static async create(
		config: SfuConfig,
		onDied: WorkerDiedHandler,
	): Promise<MediaWorker> {
		const worker = await mediasoup.createWorker({
			logLevel: config.worker.logLevel,
			logTags: config.worker.logTags,
		})

		worker.on("died", onDied)
		worker.on("listenererror", (error) => {
			console.error("[sfu] worker listener error", error)
		})

		try {
			const rtcServer = await worker.createWebRtcServer({
				listenInfos: config.listens,
				appData: {
					node_id: config.nodeId.toString(),
					hostname: config.hostname,
				},
			})

			return new MediaWorker(worker, rtcServer)
		} catch (error) {
			worker.close()
			throw error
		}
	}

	get alive(): boolean {
		return !this.worker.closed
	}

	async close(): Promise<void> {
		if (this.worker.closed) return

		this.rtcServer.close()
		this.worker.close()
	}
}

export default MediaWorker
