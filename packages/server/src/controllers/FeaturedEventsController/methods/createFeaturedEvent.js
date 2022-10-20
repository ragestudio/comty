import { FeaturedEvent } from "../../../models"

export default async (payload) => {
    const {
        name,
        category,
        description,
        dates,
        location,
        announcement,
    } = payload

    const featuredEvent = new FeaturedEvent({
        name,
        category,
        description,
        dates,
        location,
        announcement,
    })

    await featuredEvent.save()

    return featuredEvent
}