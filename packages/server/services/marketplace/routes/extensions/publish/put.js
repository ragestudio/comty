import { Extension } from "@db_models"

import fs from "node:fs"
import path from "node:path"
import sevenzip from "7zip-min"

async function uploadFolderToB2(bucketId, folderPath, b2Directory) {
	try {
		const uploadFiles = async (dir) => {
			const files = fs.readdirSync(dir)

			for (const file of files) {
				const fullPath = path.join(dir, file)
				const stats = fs.statSync(fullPath)

				if (stats.isDirectory()) {
					await uploadFiles(fullPath)
				} else {
					const fileData = fs.readFileSync(fullPath)
					const b2FileName = path
						.join(b2Directory, path.relative(folderPath, fullPath))
						.replace(/\\/g, "/")

					console.log(`Uploading ${b2FileName}...`)

					const uploadUrl = await b2.getUploadUrl({
						bucketId: bucketId,
					})

					await b2.uploadFile({
						uploadUrl: uploadUrl.data.uploadUrl,
						uploadAuthToken: uploadUrl.data.authorizationToken,
						fileName: b2FileName,
						data: fileData,
					})

					console.log(`Uploaded ${b2FileName}`)
				}
			}
		}

		await uploadFiles(folderPath)
		console.log("All files uploaded successfully.")
	} catch (error) {
		console.error("Error uploading folder:", error)
	}
}

export default {
	middlewares: ["withAuthentication"],
	fn: async (req, res) => {
		let { pkg } = req.headers

		if (!pkg) {
			throw new OperationError(400, "Missing package")
		}

		if (!req.auth) {
			throw new OperationError(401, "Unauthorized")
		}

		pkg = JSON.parse(pkg)

		const { user_id } = req.auth.session
		const registryId = `${user_id}/${pkg.name}@${pkg.version}`
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
			registryId: registryId,
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

			await uploadFolderToB2(process.env.B2_BUCKET_ID, pkgPath, s3Path)

			fs.promises.rm(workPath, { recursive: true, force: true })

			const assetsUrl = `https://${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${s3Path}`

			extensionRegistry = await Extension.create({
				user_id: user_id,
				name: pkg.name,
				version: pkg.version,
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
