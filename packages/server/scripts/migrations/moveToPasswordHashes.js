import DbManager from "@shared-classes/DbManager"
import { User, PasswordHash } from "@db_models"

async function main() {
	await global.injectEnvFromInfisical()

	const db = new DbManager()
	await db.initialize()

	const users = await User.find().select("+password")

	for await (const user of users) {
		// check if user has password field
		if (!user.password) {
			continue
		}

		// check if already has password hash entry
		let passwordHash = await PasswordHash.findOne({
			user_id: user._id.toString(),
		})

		if (passwordHash) {
			continue
		}

		await PasswordHash.create({
			user_id: user._id.toString(),
			hash: user.password,
		})

		console.log(
			`Password hash migrated for user [${user.username}] ${user._id.toString()}`,
		)
	}

	console.log("Migration done")
	process.exit(0)
}

main()
