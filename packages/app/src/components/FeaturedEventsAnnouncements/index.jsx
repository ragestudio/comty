import React from "react"

import { Icons } from "components/Icons"
import Announcement from "../FeaturedEventAnnouncement"

import "./index.less"

export default React.memo((props) => {
    const [featuredEvents, setFeaturedEvents] = React.useState([])

    const fetchFeaturedEvents = React.useCallback(async () => {
        let { data } = await app.api.customRequest("main", {
            url: "/featured_events",
            method: "GET"
        }).catch((err) => {
            console.error(err)
            app.message.error(`Failed to fetch featured events`)

            return {
                data: null
            }
        })

        if (data) {
            // parse announcement data
            data = data.map((item) => {
                try {
                    item.announcement = JSON.parse(item.announcement)
                } catch (error) {
                    console.error(error)
                    app.message.error(`Failed to parse announcement data`)
                }
                return item
            })

            setFeaturedEvents(data)
        }

    }, [])

    React.useEffect(() => {
        fetchFeaturedEvents()
    }, [])

    return <div className="featuredEvents">
        {featuredEvents.map((event, index) => <Announcement index={index} data={event.announcement} />)}
    </div>
})