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
				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, progress)
				}
			} catch (error) {
				console.error(error)
			}
		})

		worker.on("completed", (job, result) => {
			try {
				console.log(`Job ${job.id} completed with result:`, result)

				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, {
						event: "done",
						state: "done",
						result: result,
					})
				}
			} catch (error) {
				console.error(error)
			}
		})

		worker.on("failed", (job, error) => {
			try {
				console.error(`Job ${job.id} failed:`, error)

				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, {
						event: "error",
						state: "error",
						result: error.message,
					})
				}
			} catch (error) {
				console.error(error)
			}
		})
	}

	createJob = async (queueId, data, { useSSE = false } = {}) => {
		const queue = this.queues[queueId]

		if (!queue) {
			throw new Error("Queue not found")
		}

		let sseChannelId = null

		if (useSSE) {
			sseChannelId = `${global.nanoid()}`
		}

		const job = await queue.add("default", {
			...data,
			sseChannelId,
		})

		if (sseChannelId) {
			await global.sse.createChannel(sseChannelId)
			console.log(
				`[JOB] Created new job with SSE channel [${sseChannelId}]`,
			)

			await global.sse.sendToChannel(sseChannelId, {
				event: "job_queued",
				state: "progress",
				percent: 5,
			})
		}

		console.log(`[JOB] Created new job with ID [${job.id}]`)

		return {
			...job,
			sseChannelId,
		}
	}

	// this function cleans up all queues, must be synchronous
	cleanUp = () => {
		const queues = Object.values(this.queues)
		queues.forEach((queue) => queue.close())

		console.log("All queues have been closed")
	}
}
