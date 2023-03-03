import { StreamingCategory } from "@models"

export default {
    method: "GET",
    route: "/streaming/categories",
    fn: async (req, res) => {
        const categories = await StreamingCategory.find()

        if (req.query.key) {
            const category = categories.find((category) => category.key === req.query.key)

            return res.json(category)
        }

        return res.json(categories)
    }
}