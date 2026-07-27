import type { FilesCore } from "../files.core"
import type { UploadTask } from "./task"

import { EventEmitter } from "tseep/lib/ee-safe"

export class UploadTasksManager extends EventEmitter {
	static get maxTasks() {
		return 3
	}

	queue: UploadTask[] = []
	running_ids: string[] = []

	constructor(private core: FilesCore) {
		super()
	}

	private handleTask = (task: UploadTask) => {
		const removeFromRunning = () => {
			this.running_ids = this.running_ids.filter((id) => id !== task.id)
		}

		const taskError = (error: Error) => {
			this.core.console.error(`Task [${task.id}] error. >`, error)

			removeFromRunning()
			this.tick()

			this.emit("task-error", {
				task_id: task.id,
				error: error,
			})
			this.emit(`task-${task.id}-error`, error)
		}

		const taskFinish = (result: any) => {
			this.core.console.debug(`Task [${task.id}] finished. >`, result)

			removeFromRunning()
			this.tick()

			this.emit("task-finish", {
				task_id: task.id,
				result: result,
			})
			this.emit(`task-${task.id}-finish`, result)
		}

		return new Promise(async (resolve, reject) => {
			try {
				this.core.console.log(`Task [${task.id}] started`)
				this.running_ids.push(task.id)

				if (!task.ready) {
					await task.initialize()
				}

				task.once("finish", (result) => {
					taskFinish(result)
					resolve(result)
				})

				task.once("error", (e) => {
					taskError(e)
					reject(e)
				})

				task.start()
			} catch (e) {
				taskError(e)
				reject(e)
			}
		})
	}

	tick() {
		if (this.running_ids.length >= UploadTasksManager.maxTasks) {
			return false
		}

		if (this.queue.length === 0) {
			return false
		}
		const tasksToStart = this.queue
			.splice(0, UploadTasksManager.maxTasks - this.running_ids.length)
			.filter((t) => t)

		tasksToStart.forEach((t) => this.handleTask(t))

		return true
	}

	add(task: UploadTask) {
		this.queue.push(task)
		this.tick()

		return new Promise((resolve, reject) => {
			task.once("finish", (data) => {
				resolve(data)
			})

			task.once("error", (e) => {
				reject(e)
			})
		})
	}

	remove(task_id: string) {
		this.queue = this.queue.filter((t) => t.id !== task_id)
	}
}

export default UploadTasksManager
