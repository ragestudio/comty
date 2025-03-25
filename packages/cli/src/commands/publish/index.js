import fs from "node:fs"
import path from "node:path"
import yoctoSpinner from "yocto-spinner"
import { fileFromPath } from "formdata-node/file-from-path"
import FormData from "form-data"

import Cache from "../../classes/cache.js"
import getUploadsPaths from "../../utils/getUploadsPaths.js"
import compressFiles from "../../utils/compressFiles.js"

import Request from "comty.js/dist/request.js"

export default {
	cmd: "publish",
	arguments: [
		{
			argument: "<cwd>",
			description: "Set the current working directory",
		},
	],
	fn: async (customCwd) => {
		const token = global.config.get("auth").token
		const projectFolder = customCwd ?? process.cwd()
		const pkgJsonPath = path.join(projectFolder, "package.json")

		let pkgJSON = null

		if (!fs.existsSync(pkgJsonPath)) {
			console.error("package.json not found")
			return 1
		}

		pkgJSON = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"))
		console.log(`⚙️ Publishing ${pkgJSON.name}@${pkgJSON.version}`)

		const [temporalDir, destroyTemporalDir] =
			await Cache.createTemporalDir()

		const spinner = yoctoSpinner({ text: "Loading…" }).start()

		try {
			spinner.text = "Reading files..."
			const paths = await getUploadsPaths(pkgJsonPath)

			const originPath = path.join(temporalDir, "origin")
			const bundlePath = path.join(temporalDir, "bundle.7z")

			// copy files and dirs to origin path
			spinner.text = "Copying files and directories"
			for await (const file of paths) {
				await fs.promises.cp(
					file,
					path.join(originPath, path.basename(file)),
					{ recursive: true },
				)
			}

			spinner.text = "Compressing files"
			await compressFiles(`${originPath}/*`, bundlePath)

			// PUT to registry
			const bodyData = new FormData()

			//bodyData.append("pkg", JSON.stringify(pkgJSON))
			bodyData.append("bundle", fs.createReadStream(bundlePath))

			spinner.text = "Publishing extension"
			const response = await Request.default({
				method: "PUT",
				url: "/extensions/publish",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "multipart/form-data",
					pkg: JSON.stringify(pkgJSON),
				},
				data: bodyData,
			}).catch((error) => {
				throw new Error(
					`Failed to publish extension: ${error.response?.data?.error ?? error.message}`,
				)
			})

			// cleanup
			spinner.text = "Cleaning up"
			await destroyTemporalDir()

			spinner.success(`Ok!`)

			console.log(response.data)
			return 0
		} catch (error) {
			await destroyTemporalDir()

			spinner.error(`${error.message}`)
			console.error(error)

			return 1
		}
	},
}
