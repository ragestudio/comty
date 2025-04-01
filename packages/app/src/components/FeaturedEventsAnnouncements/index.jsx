import React from "react"

import Announcement from "../FeaturedEventAnnouncement"
import EventsModel from "@models/events"

import "./index.less"

const FeaturedEventsAnnouncements = React.memo((props) => {
	const [
		L_FeaturedEvents,
		R_FeaturedEvents,
		E_FeaturedEvents,
		M_FeaturedEvents,
	] = app.cores.api.useRequest(EventsModel.getFeatured)

	if (!Array.isArray(R_FeaturedEvents)) {
		return null
	}

	return (
		<div className="featuredEvents">
			{R_FeaturedEvents.map((event, index) => (
				<Announcement index={index} data={event} />
			))}
		</div>
	)
})

export default FeaturedEventsAnnouncements
