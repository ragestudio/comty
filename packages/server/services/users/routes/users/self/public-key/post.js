import { UserPublicKey } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const { public_key } = req.body

		if (!public_key) {
			throw new OperationError(400, "Public key is required")
		}

		// Buscar o crear registro de clave pública
		let record = await UserPublicKey.findOne({ user_id: userId })

		if (!record) {
			// Crear nuevo registro
			record = await UserPublicKey.create({
				user_id: userId,
				public_key: public_key,
				created_at: new Date().getTime(),
				updated_at: new Date().getTime(),
			})
		} else {
			// Actualizar registro existente
			record.public_key = public_key
			record.updated_at = new Date().getTime()
			await record.save()
		}

		return {
			success: true,
			message: "Public key updated successfully",
		}
	},
}
