import fs from "node:fs"
import path from "node:path"

export default async function readGitIgnore(projectFolder) {
	const gitIgnorePath = path.join(projectFolder, ".gitignore")

	if (!fs.existsSync(gitIgnorePath)) {
		return []
	}

	return fs.readFileSync(gitIgnorePath, "utf8").split("\n").filter(Boolean)
}
