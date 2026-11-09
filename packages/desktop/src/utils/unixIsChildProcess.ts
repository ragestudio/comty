import fs from "node:fs"

export default async (
	pid: number | string,
	parentPid: number,
): Promise<boolean> => {
	try {
		const status = await fs.promises.readFile(`/proc/${pid}/status`, "utf8")

		const match = status.match(/^PPid:\s+(\d+)/m)

		if (match?.[1]) {
			return Number.parseInt(match[1], 10) === parentPid
		}

		return false
	} catch (error) {
		console.error("Failed to check process:", error)
		return false
	}
}
