import fs from "node:fs"
import path from "node:path"
import { glob } from "glob"

export default async function getUploadsPaths(pkgJsonPath) {
	const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"))
	const projectFolder = path.dirname(pkgJsonPath)
	//const gitIgnore = await readGitIgnore(projectFolder)

	let globs = []

	if (Array.isArray(pkgJson.files)) {
		globs.push(...pkgJson.files)
	}

	globs = globs.map((glob) => path.resolve(projectFolder, glob))

	globs = await glob(globs, { cwd: projectFolder })

	globs.push(pkgJsonPath)

	return globs
}
