import { parseXml as cmlParseXml } from "@svta/common-media-library/xml/parseXml.js"
import DashConstants from "./constants"

import DurationMatcher from "./matchers/duration"
import DateTimeMatcher from "./matchers/datetime"
import NumericMatcher from "./matchers/numeric"
import LangMatcher from "./matchers/lang"

const arrayNodes = [
	DashConstants.PERIOD,
	DashConstants.BASE_URL,
	DashConstants.ADAPTATION_SET,
	DashConstants.REPRESENTATION,
	DashConstants.CONTENT_PROTECTION,
	DashConstants.ROLE,
	DashConstants.ACCESSIBILITY,
	DashConstants.AUDIO_CHANNEL_CONFIGURATION,
	DashConstants.CONTENT_COMPONENT,
	DashConstants.ESSENTIAL_PROPERTY,
	DashConstants.LABEL,
	DashConstants.S,
	DashConstants.SEGMENT_URL,
	DashConstants.EVENT,
	DashConstants.EVENT_STREAM,
	DashConstants.LOCATION,
	DashConstants.SERVICE_DESCRIPTION,
	DashConstants.SUPPLEMENTAL_PROPERTY,
	DashConstants.METRICS,
	DashConstants.REPORTING,
	DashConstants.PATCH_LOCATION,
	DashConstants.REPLACE,
	DashConstants.ADD,
	DashConstants.REMOVE,
	DashConstants.UTC_TIMING,
	DashConstants.INBAND_EVENT_STREAM,
	DashConstants.PRODUCER_REFERENCE_TIME,
	DashConstants.CONTENT_STEERING,
]

function processNode(node, matchers) {
	// Convert tag name
	let p = node.nodeName.indexOf(":")
	if (p !== -1) {
		node.__prefix = node.prefix
		node.nodeName = node.localName
	}

	const { childNodes, attributes, nodeName } = node
	node.tagName = nodeName

	// Convert attributes
	for (let k in attributes) {
		let value = attributes[k]

		if (nodeName === "S") {
			value = parseInt(value)
		} else {
			for (let i = 0, len = matchers.length; i < len; i++) {
				const matcher = matchers[i]
				if (matcher.test(nodeName, k, value)) {
					value = matcher.converter(value)
					break
				}
			}
		}

		node[k] = value
	}

	// Convert children
	const len = childNodes?.length

	for (let i = 0; i < len; i++) {
		const child = childNodes[i]

		if (child.nodeName === "#text") {
			node.__text = child.nodeValue
			continue
		}

		processNode(child, matchers)

		const { nodeName } = child

		if (Array.isArray(node[nodeName])) {
			node[nodeName].push(child)
		} else if (arrayNodes.indexOf(nodeName) !== -1) {
			if (!node[nodeName]) {
				node[nodeName] = []
			}
			node[nodeName].push(child)
		} else {
			node[nodeName] = child
		}
	}

	node.__children = childNodes
}

export default async (mpd_string, url) => {
	let manifest = {
		protocol: "DASH",
	}

	const matchers = [
		new DurationMatcher(),
		new DateTimeMatcher(),
		new NumericMatcher(),
		new LangMatcher(),
	]

	const xml = cmlParseXml(mpd_string)

	const root =
		xml.childNodes.find(
			(child) => child.nodeName === "MPD" || child.nodeName === "Patch",
		) || xml.childNodes[0]

	processNode(root, matchers)

	manifest = {
		...manifest,
		...root,
		loadedTime: new Date(),
		url: url,
		originalUrl: url,
		baseUri: url,
	}

	return manifest
}
