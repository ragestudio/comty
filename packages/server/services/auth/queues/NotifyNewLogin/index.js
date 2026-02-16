import Worker from "./worker.js"

export default {
	id: "notify-new-login",
	maxJobs: 400,
	process: Worker,
}
