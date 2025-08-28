import { Extension } from "@db_models"

import fs from "node:fs"
import path from "node:path"
import sevenzip from "7zip-min"

import putObject from "@shared-classes/Upload/putObject"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		let { pkg } = req.headers

		if (!pkg) {
			throw new OperationError(400, "Missing package")
		}

		if (!req.auth) {
			throw new OperationError(401, "Unauthorized")
		}

		pkg = JSON.parse(pkg)

		const { user_id } = req.auth.session
		const registryId = `${user_id}/${pkg.name}`
		const s3Path = `extensions/${pkg.name}/${pkg.version}`

		const workPath = path.resolve(
			global.cache.constructor.cachePath,
			String(Date.now()),
			registryId,
		)
		const pkgPath = path.resolve(workPath, "pkg")
		const bundlePath = path.resolve(workPath, "bundle.7z")

		// console.log({
		//     user_id,
		//     pkg,
		//     registryId,
		//     s3Path,
		//     workPath,
		//     bundlePath
		// })

		let extensionRegistry = await Extension.findOne({
			user_id: user_id,
			name: pkg.name,
			version: pkg.version,
		})

		if (extensionRegistry) {
			throw new OperationError(400, "Extension already exists")
		}

		try {
			if (!fs.existsSync(workPath)) {
				await fs.promises.mkdir(workPath, { recursive: true })
			}

			// read multipart form
			await req.multipart(async (field) => {
				await field.write(bundlePath)
			})

			await new Promise((resolve, reject) => {
				sevenzip.unpack(bundlePath, pkgPath, (error) => {
					if (error) {
						fs.promises.rm(workPath, {
							recursive: true,
							force: true,
						})
						reject(error)
					} else {
						resolve()
					}
				})
			})

			await putObject({
				filePath: pkgPath,
				uploadPath: s3Path,
			})

			fs.promises.rm(workPath, { recursive: true, force: true })

			const assetsUrl = `${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${s3Path}`

			extensionRegistry = await Extension.create({
				user_id: user_id,
				name: pkg.name,
				version: pkg.version,
				description: pkg.description,
				registryId: registryId,
				assetsUrl: assetsUrl,
				srcUrl: `${assetsUrl}/src`,
				packageUrl: `${assetsUrl}/package.json`,
				created_at: Date.now(),
			})

			return extensionRegistry
		} catch (error) {
			fs.promises.rm(workPath, { recursive: true, force: true })
			throw error
		}
	},
}
