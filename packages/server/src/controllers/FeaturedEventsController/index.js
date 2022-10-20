import { Controller } from "linebridge/dist/server"
import { FeaturedEvent } from "../../models"

import createFeaturedEvent from "./methods/createFeaturedEvent"

export default class FeaturedEventsController extends Controller {
    get = {
        "/featured_event/:id": async (req, res) => {
            const { id } = req.params

            const featuredEvent = await FeaturedEvent.findById(id)

            return res.json(featuredEvent)
        },
        "/featured_events": async (req, res) => {
            const featuredEvents = await FeaturedEvent.find()

            return res.json(featuredEvents)
        }
    }

    post = {
        "/featured_event": {
            middlewares: ["withAuthentication", "onlyAdmin"],
            fn: async (req, res) => {
                const result = await createFeaturedEvent(req.body).catch((err) => {
                    res.status(500).json({
                        error: err.message
                    })

                    return null
                })

                if (result) {
                    return res.json(result)
                }
            }
        }
    }

    delete = {
        "/featured_event/:id": {
            middlewares: ["withAuthentication", "onlyAdmin"],
            fn: async (req, res) => {
                const { id } = req.params

                const featuredEvent = await FeaturedEvent.findByIdAndDelete(id)

                return res.json(featuredEvent)
            }
        }
    }
}