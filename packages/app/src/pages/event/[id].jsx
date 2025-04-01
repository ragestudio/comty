import React, { useState, useEffect } from "react"
import { Skeleton, Button, Tooltip, Popover, Tag } from "antd"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { DateTime } from "luxon"
import createGoogleCalendarEvent from "@utils/createGoogleCalendarEvent"

import EventsModel from "@models/events"
import useCenteredContainer from "@hooks/useCenteredContainer"

import { Icons } from "@components/Icons"

import ContrastYIQ from "@utils/contrastYIQ"
import ProcessString from "@utils/processString"

import "./index.less"

const LocationProcessRegexs = [
	{
		regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
		fn: (key, result) => (
			<a
				key={key}
				href={result[1]}
				target="_blank"
				rel="noopener noreferrer"
			>
				{result[1]}
			</a>
		),
	},
]

const EventCountdown = ({ date, prefix }) => {
	const [label, setLabel] = useState(null)

	useEffect(() => {
		function updateCountdown() {
			const nowDate = DateTime.local()
			const fromDate = DateTime.fromISO(date)
			const diff = fromDate.diff(nowDate, "minutes").values
			setLabel(nowDate.plus(diff).toRelative())
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 1000)
		return () => clearInterval(interval)
	}, [date])

	return (
		<div className="field">
			<div className="field-label">
				<Icons.FiClock />
				<p>
					{prefix} {label}
				</p>
			</div>
		</div>
	)
}

const EventStartDate = ({ startDate, started }) => (
	<Popover
		content={
			<EventCountdown
				date={startDate}
				prefix={started ? "Started" : "Starts"}
			/>
		}
	>
		<div className="field">
			<div className="field-label">
				<Icons.FiCalendar />
				{startDate.toLocaleString(DateTime.DATE_FULL)}
			</div>
			<div className="field-label">
				<Icons.FiClock />
				{startDate.toLocaleString(DateTime.TIME_SIMPLE)}
			</div>
		</div>
	</Popover>
)

const EventHeader = ({ pageConfig, event, contrastColor }) => {
	if (pageConfig.header) {
		return (
			<div
				id="eventHeader"
				className="header custom"
				style={{
					...(pageConfig.header.style ?? {}),
					color: `var(--text-color-${contrastColor})`,
				}}
			>
				{pageConfig.header.displayLogo && (
					<div className="logo">
						<img src={pageConfig.header.logoImg} alt="Event Logo" />
					</div>
				)}
				{pageConfig.header.displayTitle && (
					<div className="title">
						<h1>{pageConfig.header.title}</h1>
						<h2>{pageConfig.header.description}</h2>
					</div>
				)}
			</div>
		)
	}

	return (
		<div
			className="header"
			style={event.announcement.backgroundStyle}
			id="eventHeader"
		>
			{event.announcement.logoImg && (
				<div className="logo">
					<img src={event.announcement.logoImg} alt="Event Logo" />
				</div>
			)}
			<div className="title">
				<h1>{event.name}</h1>
				<h2>{event.announcement.description}</h2>
			</div>
		</div>
	)
}

const EventPage = (props) => {
	useCenteredContainer(false)

	const [L_Event, R_Event, E_Event, M_Event] = app.cores.api.useRequest(
		EventsModel.data,
		props.params["id"],
	)
	const [contrastColor, setContrastColor] = useState(null)
	const [started, setStarted] = useState(false)
	const [ended, setEnded] = useState(false)

	useEffect(() => {
		if (!R_Event) return

		// Calculate event status
		const now = DateTime.local()
		const eventStart = DateTime.fromISO(R_Event.startDate)
		const eventEnd = DateTime.fromISO(R_Event.endDate)

		const startDiff = eventStart.diff(now, "minutes").values
		const endDiff = eventEnd.diff(now, "minutes").values

		setStarted(startDiff.minutes < 0)
		setEnded(endDiff.minutes < 0)

		// Calculate contrast color for header
		if (R_Event.pageConfig?.header?.style?.backgroundImage) {
			const url = R_Event.pageConfig.header.style.backgroundImage
				.replace("url(", "")
				.replace(")", "")
				.replace(/['"]/gi, "")

			ContrastYIQ.fromUrl(url).then(setContrastColor)
		}
	}, [R_Event])

	const handleClickWatchLiveStream = () => {
		if (!R_Event?.pageConfig?.livestreamId) return
		app.location.push(`/tv/live/${R_Event.pageConfig.livestreamId}`)
	}

	const handleClickAddToCalendar = () => {
		createGoogleCalendarEvent({
			title: R_Event.name,
			startDate: new Date(R_Event.startDate),
			endDate: new Date(R_Event.endDate),
			description: `${R_Event.shortDescription} - See details at ${location.href}`,
			location: R_Event.location,
		})
	}

	if (E_Event) {
		return null
	}

	if (L_Event) {
		return <Skeleton active />
	}

	if (!R_Event) {
		return null
	}

	const eventStartedOrEnded = started || ended
	const startDate = DateTime.fromISO(R_Event.startDate)
	const endDate = DateTime.fromISO(R_Event.endDate)
	const { pageConfig } = R_Event

	return (
		<div className="event">
			<EventHeader
				pageConfig={pageConfig}
				event={R_Event}
				contrastColor={contrastColor}
			/>

			<div className="content">
				<div className="panel">
					<div className="card">
						{started && !ended && (
							<div className="field">
								<div className="field-label">
									<div className="pulse_circle" />
									<p>Started</p>
								</div>
								<div className="field-value">
									<EventCountdown
										date={endDate}
										prefix="Ends"
									/>
								</div>
							</div>
						)}

						{!started && (
							<EventStartDate
								startDate={startDate}
								started={started}
							/>
						)}

						<div className="field">
							<div className="field-label">
								<Icons.FiMapPin />
								{ProcessString(LocationProcessRegexs)(
									R_Event.location,
								)}
							</div>
						</div>
					</div>

					{!eventStartedOrEnded && (
						<div className="card">
							<Button onClick={handleClickAddToCalendar}>
								<Icons.FiCalendar /> Add to Calendar
							</Button>
						</div>
					)}

					{started && pageConfig.livestreamId && (
						<div className="card">
							<Button
								type="primary"
								onClick={handleClickWatchLiveStream}
							>
								<Icons.FiPlay /> Watch Live
							</Button>
						</div>
					)}
				</div>

				<div className="panel">
					<div className="card">
						<div className="page-render">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								rehypePlugins={[rehypeRaw]}
								children={R_Event.page}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EventPage
