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
			this.toClientSocket(job, progress)
		})

		worker.on("completed", (job, result) => {
			console.debug(`Job [${job.id}] completed with result:`, result)

			this.toClientSocket(job, {
				event: "done",
				state: "done",
				result: result,
			})
		})

		worker.on("failed", (job, error) => {
			console.error(`Job [${job.id}] failed:`, error)

			this.toClientSocket(job, {
				event: "error",
				state: "error",
				result: error.message,
			})
		})
	}

	createJob = async (queueId, data) => {
		const queue = this.queues[queueId]

		if (!queue) {
			throw new Error("Queue not found")
		}

		const job = await queue.add("default", data)
		console.log(`[JOB] Created new job with ID [${job.id}]`)

		this.toClientSocket(job, {
			event: "job_queued",
			state: "progress",
			percent: 5,
		})

		return job
	}

	// this function cleans up all queues, must be synchronous
	cleanUp = () => {
		const queues = Object.values(this.queues)
		queues.forEach((queue) => queue.close())

		console.log("All queues have been closed")
	}

	toClientSocket = async (job, payload) => {
		try {
			if (!global.websockets) return
			if (typeof global.websockets?.senders?.toUserId !== "function")
				return
			if (!job || !job.data) return
			if (!job.data.useWebsocketEvents) return
			if (!job.data.user_id) return

			await global.websockets.senders.toUserId(
				job.data.user_id,
				`cloud-tasks:job`,
				{
					job_id: job.id,
					...payload,
				},
			)
			// await global.websockets.senders.toUserId(
			// 	job.data.user_id,
			// 	`job:${job.id}`,
			// 	payload,
			// )
		} catch (err) {
			console.error("Error sending job data to client socket:", err)
		}
	}
}
