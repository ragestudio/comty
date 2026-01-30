import fs from "node:fs"
import { Queue, Worker } from "bullmq"

export default class TaskQueueManager {
	constructor(params) {
		if (!params) {
			throw new Error("Missing params")
		}

		this.params = params
		this.queues = {}
		this.workers = {}
	}

	async initialize(options = {}) {
		const queues = fs.readdirSync(this.params.workersPath)

		for await (const queue of queues) {
			const queuePath = `${this.params.workersPath}/${queue}`
			let queueObj = await import(queuePath)

			queueObj = queueObj.default ?? queueObj

			if (typeof queueObj.process === "undefined") {
				continue
			}

			this.queues[queueObj.id] = this.registerQueue(queueObj, options)
		}
	}

	registerQueue = (queueObj, options) => {
		const queue = new Queue(queueObj.id, {
			connection: options.redisOptions,
			defaultJobOptions: {
				removeOnComplete: true,
			},
		})

		const worker = new Worker(queueObj.id, queueObj.process, {
			connection: options.redisOptions,
			concurrency: queueObj.maxJobs ?? 1,
		})

		this.registerQueueEvents(worker)
		this.queues[queueObj.id] = queue
		this.workers[queueObj.id] = worker

		return queue
	}

	registerQueueEvents = (worker) => {
		worker.on("progress", (job, progress) => {
			try {
				if (job.data.useWebsocketEvents && job.data.user_id) {
					global.websockets.senders.toUserId(
						job.data.user_id,
						`job:${job.data.uploadId}`,
						progress,
					)
				}
			} catch (error) {
				console.error(error)
			}
		})

		worker.on("completed", (job, result) => {
			try {
				console.debug(`Job [${job.id}] completed with result:`, result)

				if (job.data.useWebsocketEvents && job.data.user_id) {
					global.websockets.senders.toUserId(
						job.data.user_id,
						`job:${job.data.uploadId}`,
						{
							event: "done",
							state: "done",
							result: result,
						},
					)
				}
			} catch (error) {
				console.error(error)
			}
		})

		worker.on("failed", (job, error) => {
			try {
				console.error(`Job [${job.id}] failed:`, error)

				if (job.data.useWebsocketEvents && job.data.user_id) {
					global.websockets.senders.toUserId(
						job.data.user_id,
						`job:${job.data.uploadId}`,
						{
							event: "error",
							state: "error",
							result: error.message,
						},
					)
				}
			} catch (error) {
				console.error(error)
			}
		})
	}

	createJob = async (queueId, data) => {
		const queue = this.queues[queueId]

		if (!queue) {
			throw new Error("Queue not found")
		}

		const job = await queue.add("default", data)

		if (
			typeof data.user_id === "string" &&
			data.useWebsocketEvents &&
			global.websockets &&
			typeof global.websockets.senders?.toUserId === "function"
		) {
			await global.websockets.senders.toUserId(
				data.user_id,
				`job:${data.uploadId}`,
				{
					event: "job_queued",
					state: "progress",
					percent: 5,
				},
			)
		}

		console.log(`[JOB] Created new job with ID [${job.id}]`)

		return job
	}

	// this function cleans up all queues, must be synchronous
	cleanUp = () => {
		const queues = Object.values(this.queues)
		queues.forEach((queue) => queue.close())

		console.log("All queues have been closed")
	}
}
