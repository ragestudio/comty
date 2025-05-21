export default (baseUri, mpdText, periodId = null, repId = null) => {
	// parse xml
	const parser = new DOMParser()
	const xml = parser.parseFromString(mpdText, "application/xml")

	// check parse errors
	const err = xml.querySelector("parsererror")

	if (err) {
		console.error("Failed to parse MPD:", err.textContent)
		return null
	}

	// select period (by ID or first)
	let period = null

	if (periodId) {
		period = xml.querySelector(`Period[id="${periodId}"]`)
	}

	// if not found, select first
	if (!period) {
		period = xml.querySelector("Period")
	}

	// ultimately, return err
	if (!period) {
		console.error("Cannot find a <Period> on provided MPD")
		return null
	}

	// select representation (by ID or first)
	let rep = null

	if (repId) {
		rep = xml.querySelector(`Representation[id="${repId}"]`)
	}

	if (!rep) {
		rep = period.querySelector("AdaptationSet Representation")
	}

	if (!rep) {
		console.error("Cannot find a <Representation> on Period")
		return null
	}

	// read the associated SegmentTemplate (it may be in AdaptationSet or in Representation)
	let tmpl = rep.querySelector("SegmentTemplate")

	if (!tmpl) {
		// fallback: look in the parent AdaptationSet
		const adaptation = rep.closest("AdaptationSet")
		tmpl = adaptation && adaptation.querySelector("SegmentTemplate")
	}

	if (!tmpl) {
		console.error(
			"Could not find <SegmentTemplate> in either Representation or AdaptationSet.",
		)
		return null
	}

	// extract the initialization attribute
	const initAttr = tmpl.getAttribute("initialization")

	if (!initAttr) {
		console.warn(
			"The <SegmentTemplate> does not declare initialization; it may be self-initializing.",
		)
		return null
	}

	// replace $RepresentationID$ if necessary
	const initPath = initAttr.replace(
		/\$RepresentationID\$/g,
		rep.getAttribute("id"),
	)

	return new URL(initPath, baseUri).toString()
}
