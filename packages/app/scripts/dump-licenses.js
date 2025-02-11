import fs from "node:fs"
import path from "node:path"

async function main() {
	const cwd = process.cwd()
	const outputFilePath = path.resolve(
		process.cwd(),
		"public",
		"oss-licenses.json",
	)

	if (
		await fs.promises.stat(outputFilePath).then(
			() => true,
			() => false,
		)
	) {
		fs.unlinkSync(outputFilePath)
	}

	const rootPkgJson = JSON.parse(
		fs.readFileSync(path.resolve(cwd, "package.json")),
	)

	const modules = Object.entries(rootPkgJson.dependencies).map(
		([name, version]) => ({ name, version }),
	)

	let licenses = []

	for await (const mod of modules) {
		const pkgJsonPath = path.resolve(
			cwd,
			"node_modules",
			mod.name,
			"package.json",
		)

		if (
			!(await fs.promises.stat(pkgJsonPath).then(
				() => true,
				() => false,
			))
		) {
			continue
		}

		const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath))

		console.log(`Computing license for [${mod.name}]`)

		licenses.push({
			name: pkgJson.name,
			version: pkgJson.version,
			license: pkgJson.license,
			author: pkgJson.author,
		})
	}

	licenses = licenses.sort((a, b) => a.name.localeCompare(b.name))

	fs.writeFileSync(outputFilePath, JSON.stringify(licenses, null, 4))

	console.log(`Wrote [${licenses.length}] licenses to > ${outputFilePath}`)
}

main()
