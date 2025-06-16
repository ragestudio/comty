/**
 * LRC Parser Utility
 * Handles parsing and formatting of LRC (Lyric) files
 */

/**
 * Parse time string in format MM:SS.SSS or MM:SS to seconds
 * @param {string} timeStr - Time string like "01:23.45"
 * @returns {number} Time in seconds
 */
export const parseTimeToSeconds = (timeStr) => {
	const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
	if (!match) return 0

	const minutes = parseInt(match[1], 10)
	const seconds = parseInt(match[2], 10)
	const milliseconds = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0

	return minutes * 60 + seconds + milliseconds / 1000
}

/**
 * Convert seconds to LRC time format MM:SS.SSS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatSecondsToLRC = (seconds) => {
	const minutes = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	const ms = Math.floor((seconds % 1) * 1000)

	return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}

/**
 * Parse LRC content into structured data
 * @param {string} lrcContent - Raw LRC file content
 * @returns {Object} Parsed LRC data
 */
export const parseLRC = (lrcContent) => {
	if (!lrcContent || typeof lrcContent !== "string") {
		return []
	}

	const lines = lrcContent
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)

	const lyrics = []

	for (const line of lines) {
		// Check for timestamped lyrics [MM:SS.SSS]text
		const timestampMatch = line.match(
			/^\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\](.*)$/,
		)

		if (timestampMatch) {
			const [, timeStr, text] = timestampMatch
			const time = parseTimeToSeconds(timeStr)

			if (text.trim() === "") {
				lyrics.push({
					time: time,
					break: true,
				})

				continue
			}

			lyrics.push({
				time: time,
				text: text.trim(),
			})

			continue
		}
	}

	// Sort lyrics by timestamp
	lyrics.sort((a, b) => {
		if (a.time === null) return -1
		if (b.time === null) return 1
		return a.time - b.time
	})

	return lyrics
}

/**
 * Convert structured lyrics data back to LRC format
 * @param {Object} lrcData - Structured LRC data
 * @returns {string} LRC formatted string
 */
export const formatToLRC = (lrcData) => {
	const { metadata = {}, lyrics = [] } = lrcData
	const lines = []

	// Add metadata
	const metadataMapping = {
		artist: "ar",
		title: "ti",
		album: "al",
		author: "au",
		length: "length",
		creator: "by",
		editor: "re",
		version: "ve",
		offset: "offset",
	}

	Object.entries(metadata).forEach(([key, value]) => {
		const tag = metadataMapping[key] || key
		lines.push(`[${tag}:${value}]`)
	})

	if (lines.length > 0) {
		lines.push("") // Empty line after metadata
	}

	// Add lyrics
	lyrics.forEach((lyric) => {
		if (lyric.time !== null) {
			const timeStr = lyric.timeStr || formatSecondsToLRC(lyric.time)
			lines.push(`[${timeStr}]${lyric.text}`)
		} else {
			lines.push(lyric.text)
		}
	})

	return lines.join("\n")
}

/**
 * Find the current lyric line based on current time
 * @param {Array} lyrics - Array of lyric objects
 * @param {number} currentTime - Current playback time in seconds
 * @returns {Object|null} Current lyric object
 */
export const getCurrentLyric = (lyrics, currentTime) => {
	if (!lyrics || lyrics.length === 0) return null

	// Filter out lyrics without timestamps
	const timedLyrics = lyrics.filter((lyric) => lyric.time !== null)

	if (timedLyrics.length === 0) return null

	// Find the last lyric that has passed
	let currentLyric = null
	for (let i = 0; i < timedLyrics.length; i++) {
		if (timedLyrics[i].time <= currentTime) {
			currentLyric = timedLyrics[i]
		} else {
			break
		}
	}

	return currentLyric
}

/**
 * Get next lyric line
 * @param {Array} lyrics - Array of lyric objects
 * @param {number} currentTime - Current playback time in seconds
 * @returns {Object|null} Next lyric object
 */
export const getNextLyric = (lyrics, currentTime) => {
	if (!lyrics || lyrics.length === 0) return null

	const timedLyrics = lyrics.filter((lyric) => lyric.time !== null)

	for (const lyric of timedLyrics) {
		if (lyric.time > currentTime) {
			return lyric
		}
	}

	return null
}

/**
 * Insert a new lyric at specific time
 * @param {Array} lyrics - Current lyrics array
 * @param {number} time - Time in seconds
 * @param {string} text - Lyric text
 * @returns {Array} Updated lyrics array
 */
export const insertLyric = (lyrics, time, text) => {
	const newLyric = {
		time,
		timeStr: formatSecondsToLRC(time),
		text,
		id: `${time}-${Math.random().toString(36).substr(2, 9)}`,
	}

	const updatedLyrics = [...lyrics, newLyric]

	// Sort by time
	return updatedLyrics.sort((a, b) => {
		if (a.time === null) return -1
		if (b.time === null) return 1
		return a.time - b.time
	})
}

/**
 * Update existing lyric
 * @param {Array} lyrics - Current lyrics array
 * @param {string} id - Lyric ID to update
 * @param {Object} updates - Updates to apply
 * @returns {Array} Updated lyrics array
 */
export const updateLyric = (lyrics, id, updates) => {
	return lyrics.map((lyric) => {
		if (lyric.id === id) {
			const updated = { ...lyric, ...updates }
			// Update timeStr if time was changed
			if (updates.time !== undefined && updates.time !== null) {
				updated.timeStr = formatSecondsToLRC(updates.time)
			}
			return updated
		}
		return lyric
	})
}

/**
 * Remove lyric by ID
 * @param {Array} lyrics - Current lyrics array
 * @param {string} id - Lyric ID to remove
 * @returns {Array} Updated lyrics array
 */
export const removeLyric = (lyrics, id) => {
	return lyrics.filter((lyric) => lyric.id !== id)
}

/**
 * Validate LRC format
 * @param {string} lrcContent - LRC content to validate
 * @returns {Object} Validation result
 */
export const validateLRC = (lrcContent) => {
	const errors = []
	const warnings = []

	if (!lrcContent || typeof lrcContent !== "string") {
		errors.push("Invalid LRC content")
		return { isValid: false, errors, warnings }
	}

	const lines = lrcContent.split("\n")
	let hasTimestamps = false

	lines.forEach((line, index) => {
		const trimmed = line.trim()
		if (!trimmed) return

		// Check metadata format
		const metadataMatch = trimmed.match(/^\[([a-z]+):(.+)\]$/i)
		if (metadataMatch) return

		// Check timestamp format
		const timestampMatch = trimmed.match(
			/^\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\](.*)$/,
		)
		if (timestampMatch) {
			hasTimestamps = true
			const [, timeStr] = timestampMatch
			const time = parseTimeToSeconds(timeStr)
			if (time < 0) {
				errors.push(
					`Invalid timestamp at line ${index + 1}: ${timeStr}`,
				)
			}
			return
		}

		// Check for malformed brackets
		if (trimmed.includes("[") || trimmed.includes("]")) {
			warnings.push(
				`Possible malformed tag at line ${index + 1}: ${trimmed}`,
			)
		}
	})

	if (!hasTimestamps) {
		warnings.push("No timestamps found in LRC content")
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}
