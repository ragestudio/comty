import { FeaturedEvent } from "../../../models"

export default async (payload) => {
    const {
        name,
        category,
        description,
        dates,
        location,
        announcement,
        customHeader,
    } = payload

    const featuredEvent = new FeaturedEvent({
        name,
        category,
        description,
        dates,
        location,
        announcement,
        customHeader,
    })

    await featuredEvent.save()

    return featuredEvent
}