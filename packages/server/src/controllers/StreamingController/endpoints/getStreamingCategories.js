import { StreamingCategory } from "@models"

export default {
    method: "GET",
    route: "/streaming/categories",
    fn: async (req, res) => {
        const categories = await StreamingCategory.find()

        return res.json(categories)
    }
}