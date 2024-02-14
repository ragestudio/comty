import { Schematized } from "../../../lib"
import IndecentPrediction from "../../../utils/indecent-prediction"

export default {
    method: "GET",
    route: "/indecent_prediction",
    fn: Schematized({
        select: ["url"],
        required: ["url"],
    }, async (req, res) => {
        const { url } = req.selection

        const predictions = await IndecentPrediction({
            url,
        }).catch((err) => {
            res.status(500).json({
                error: err.message,
            })

            return null
        })

        if (predictions) {
            return res.json(predictions)
        }
    })
}