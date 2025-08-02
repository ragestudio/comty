import fs from "node:fs"

export default async (pid, parentPid) => {
	try {
		const status = await fs.promises.readFile(`/proc/${pid}/status`, "utf8")

		const match = status.match(/^PPid:\s+(\d+)/m)

		if (match && match[1]) {
			const ppid = parseInt(match[1], 10)

			return ppid === parentPid
		}

		return false
	} catch (error) {
		console.error("Failed to check process:", error)
		return false
	}
}
