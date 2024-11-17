import { User } from "@db_models"

const ALLOWED_FIELDS = [
    "username",
    "publicName",
    "id",
]

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const { keywords, limit = 50 } = req.query

        let filters = {}

        if (keywords) {
            keywords.split(";").forEach((pair) => {
                const [field, value] = pair.split(":")

                if (value === "" || value === " ") {
                    return
                }

                // Verifica que el campo esté en los permitidos y que tenga un valor
                if (ALLOWED_FIELDS.includes(field) && value) {
                    // Si el campo es "id", se busca coincidencia exacta
                    if (field === "id") {
                        filters[field] = value
                    } else {
                        // Para otros campos, usa $regex para coincidencias parciales
                        filters[field] = { $regex: `\\b${value}`, $options: "i" }
                    }
                }
            })
        }

        console.log(filters)

        let users = await User.find(filters)
            .limit(limit)

        return users
    }
}