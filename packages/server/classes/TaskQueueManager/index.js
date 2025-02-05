import fs from "node:fs"
import Queue from "bull"
import { composeURL as composeRedisConnectionString } from "@shared-classes/RedisClient"

process.env.DEBUG = "bull:*"

export default class TaskQueueManager {
	constructor(params, ctx) {
		if (!params) {
			throw new Error("Missing params")
		}

		this.params = params
	}

	queues = new Object()

	async initialize(options = {}) {
		const queues = fs.readdirSync(this.params.workersPath)

		for await (const queue of queues) {
			const queuePath = `${this.params.workersPath}/${queue}`
			let queueObj = await import(queuePath)

			queueObj = queueObj.default ?? queueObj

			if (typeof queueObj.process === "undefined") {
				continue
			}

			this.queues[queueObj.id] = await this.registerQueue(
				queueObj,
				options,
			)
		}
	}

	registerQueue = (queueObj, options) => {
		let queue = new Queue(queueObj.id, {
			redis: composeRedisConnectionString(options.redisOptions),
			removeOnSuccess: true,
		})

		queue = this.registerQueueEvents(queue)

		queue.process(queueObj.maxJobs ?? 1, queueObj.process)

		return queue
	}

	registerQueueEvents = (queue) => {
		queue.on("progress", (job, progress) => {
			try {
				console.log(`Job ${job.id} reported progress: ${progress}%`)

				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, {
						status: "progress",
						events: "job_progress",
						progress,
					})
				}
			} catch (error) {
				// sowy
			}
		})

		queue.on("completed", (job, result) => {
			try {
				console.log(`Job ${job.id} completed with result:`, result)

				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, {
						status: "done",
						result,
					})
				}
			} catch (error) {}
		})

		queue.on("failed", (job, error) => {
			try {
				console.error(`Job ${job.id} failed:`, error)

				if (job.data.sseChannelId) {
					global.sse.sendToChannel(job.data.sseChannelId, {
						status: "error",
						result: error.message,
					})
				}
			} catch (error) {}
		})

		return queue
	}

	createJob = async (queueId, data) => {
		const queue = this.queues[queueId]

		if (!queue) {
			throw new Error("Queue not found")
		}

		const sseChannelId = `${global.nanoid()}`

		// create job and create a sse channel id
		const job = queue.add({
			...data,
			sseChannelId,
		})

		// create the sse channel
		await global.sse.createChannel(sseChannelId)

		console.log(`[JOB] Created new job with SSE channel [${sseChannelId}]`)

		await global.sse.sendToChannel(sseChannelId, {
			status: "progress",
			events: "job_queued",
			progress: 5,
		})

		return {
			...job,
			sseChannelId: sseChannelId,
		}
	}
}
