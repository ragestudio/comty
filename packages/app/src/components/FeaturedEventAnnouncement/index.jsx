import React from "react"
import { Icons } from "@components/Icons"

import "./index.less"

const FeaturedEventAnnouncement = (props) => {
	const { announcement } = props.data

	const onClickEvent = () => {
		if (!props.data?._id) {
			console.error("No event ID provided")
			return false
		}

		app.location.push(`/event/${props.data?._id}`)
	}

	if (!announcement) {
		return null
	}

	return (
		<div
			key={props.index}
			className="featured_event"
			style={{
				backgroundImage: `url(${announcement.backgroundImg})`,
				...announcement.backgroundStyle,
			}}
			onClick={onClickEvent}
		>
			<div className="featured_event-logo">
				<img
					src={announcement.logoImg}
					style={announcement.logoStyle}
				/>
			</div>

			<div className="featured_event-content">
				<h1>{announcement.title}</h1>
				<h3>{announcement.description}</h3>
			</div>

			<div className="featured_event-indicator">
				<Icons.Target /> <span>Featured event</span>
			</div>
		</div>
	)
}

export default FeaturedEventAnnouncement
