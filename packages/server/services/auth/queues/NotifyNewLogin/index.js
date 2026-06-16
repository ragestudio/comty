import Worker from "./worker"

export default {
	id: "notify-new-login",
	maxJobs: 400,
	process: Worker,
}
