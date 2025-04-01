export default (eventDetails) => {
	// validate required parameters
	if (
		!eventDetails.title ||
		!eventDetails.startDate ||
		!eventDetails.endDate
	) {
		throw new Error(
			"Title, start date, and end date are required parameters",
		)
	}

	// format dates for calendar URL
	const formatDate = (date) => {
		return date.toISOString().replace(/-|:|\.\d+/g, "")
	}

	const startTime = formatDate(eventDetails.startDate)
	const endTime = formatDate(eventDetails.endDate)

	// create calendar URL (Google Calendar format)
	let calendarUrl =
		"https://calendar.google.com/calendar/render?action=TEMPLATE"

	// add event details to URL
	calendarUrl += `&text=${encodeURIComponent(eventDetails.title)}`
	calendarUrl += `&dates=${startTime}/${endTime}`

	if (eventDetails.description) {
		calendarUrl += `&details=${encodeURIComponent(eventDetails.description)}`
	}

	if (eventDetails.location) {
		calendarUrl += `&location=${encodeURIComponent(eventDetails.location)}`
	}

	// open the calendar URL in a new tab
	window.open(calendarUrl, "_blank")

	return calendarUrl
}
