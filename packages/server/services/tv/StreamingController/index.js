import { Controller } from "linebridge/dist/server"
import generateEndpointsFromDir from "linebridge/dist/server/lib/generateEndpointsFromDir"

export default class StreamingController extends Controller {
    static refName = "StreamingController"
    static useRoute = "/tv"

    httpEndpoints = generateEndpointsFromDir(__dirname + "/endpoints")

    // put = {
    //     "/streaming/category": {
    //         middlewares: ["withAuthentication", "onlyAdmin"],
    //         fn: Schematized({
    //             required: ["key", "label"]
    //         }, async (req, res) => {
    //             const { key, label } = req.selection

    //             const existingCategory = await StreamingCategory.findOne({
    //                 key
    //             })

    //             if (existingCategory) {
    //                 return res.status(400).json({
    //                     error: "Category already exists"
    //                 })
    //             }

    //             const category = new StreamingCategory({
    //                 key,
    //                 label,
    //             })

    //             await category.save()

    //             return res.json(category)
    //         })
    //     }
    // }
}