import Core from "evite/src/core"
import { Observable } from "object-observer"

export default class TasksQueue extends Core {
    static depends = ["settings"]

    static namespace = "tasksQueue"

    static get maxRunningTasks() {
        return app.cores.settings.get("tasks.maxRunningTasks") ?? 3
    }

    public = {
        appendToQueue: this.appendToQueue.bind(this),
        processTasks: this.processTasks.bind(this),
    }

    taskQueue = Observable.from([])

    runningTasksIds = Observable.from([])

    processTasks() {
        if (this.runningTasksIds.length >= TasksQueue.maxRunningTasks ?? 1) {
            console.log("We are already running the maximum number of tasks")
            return false
        }

        // check if there are new tasks in the queue and move them to the tasks array with the maximum number of tasks can be run
        if (this.taskQueue.length === 0) {
            console.log("No tasks in the queue")
            return false
        }

        let tasks = this.taskQueue.splice(0, TasksQueue.maxRunningTasks ?? 1)

        tasks = tasks.filter((task) => task)

        const promises = tasks.map(async (task) => {
            if (typeof task.fn !== "function") {
                throw new Error("Task must be a function")
            }

            if (typeof task.id === "undefined") {
                throw new Error("Task id is required")
            }

            // add the task to the running tasks array
            this.runningTasksIds.push(task.id)

            const taskResult = await task.fn()
                .catch((error) => {
                    // delete the task from the running tasks array
                    this.runningTasksIds = this.runningTasksIds.filter((runningTaskId) => runningTaskId !== task.id)

                    // propagate the error through an exception
                    throw error
                })

            // delete the task from the running tasks array
            this.runningTasksIds = this.runningTasksIds.filter((runningTaskId) => runningTaskId !== task.id)

            return taskResult
        })

        Promise.all(promises)
            .then((res) => {
                this.processTasks()
            })
            .catch((error) => {
                console.error(error)
                this.processTasks()
            })
    }

    appendToQueue(taskId, task) {
        if (!taskId) {
            throw new Error("Task id is required")
        }

        if (Array.isArray(task)) {
            throw new Error("Task must be a function")
        }

        this.taskQueue.unshift({
            id: taskId,
            fn: task,
        })

        this.processTasks()
    }
}