import { Extension } from "@db_models"

export default async (req) => {
	const extensions = await Extension.find()

	return extensions
}
