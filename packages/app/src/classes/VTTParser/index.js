export default class VTTParser {
	constructor() {
		this.parsedLines = []
	}

	timeToSeconds(timeStr) {
		if (!timeStr) {
			return 0
		}

		const parts = timeStr.split(":")
		let seconds = 0

		if (parts.length === 3) {
			seconds =
				parseFloat(parts[0]) * 3600 +
				parseFloat(parts[1]) * 60 +
				parseFloat(parts[2])
		} else if (parts.length === 2) {
			seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1])
		}

		return seconds
	}

	parse(vttRaw) {
		const blocks = vttRaw.replace(/\r\n/g, "\n").split("\n\n")
		this.parsedLines = []

		for (let i = 0; i < blocks.length; i++) {
			const lines = blocks[i].trim().split("\n")

			if (lines[0] === "WEBVTT" || lines.length === 0) {
				continue
			}

			let timeLineIndex = -1

			for (let j = 0; j < lines.length; j++) {
				if (lines[j].includes("-->")) {
					timeLineIndex = j
					break
				}
			}

			if (timeLineIndex === -1) {
				continue
			}

			const timeParts = lines[timeLineIndex].split(" --> ")
			const lineStart = this.timeToSeconds(timeParts[0])
			const lineEnd = this.timeToSeconds(timeParts[1])

			const rawText = lines.slice(timeLineIndex + 1).join(" ")

			const words = this.parseLinePayload(rawText, lineStart, lineEnd)

			this.parsedLines.push({
				index: this.parsedLines.length,
				start: lineStart,
				end: lineEnd,
				rawText: rawText.replace(/<[^>]*>/g, ""),
				words: words,
			})
		}

		return this.parsedLines
	}

	parseLinePayload(text, lineStart, lineEnd) {
		const words = []

		const tokens = text.split(/(<[\d:.]+>)/)

		let currentTime = lineStart

		for (let token of tokens) {
			if (token.startsWith("<") && token.endsWith(">")) {
				const timeStr = token.slice(1, -1)

				currentTime = this.timeToSeconds(timeStr)
			} else {
				if (!token.trim()) {
					continue
				}

				const subWords = token.split(/\s+/)

				for (let w of subWords) {
					if (w === "") {
						continue
					}
					words.push({
						text: w,
						start: currentTime,
						end: null,
					})
				}
			}
		}

		for (let i = 0; i < words.length; i++) {
			if (i < words.length - 1) {
				words[i].end =
					words[i + 1].start > words[i].start
						? words[i + 1].start
						: words[i].start + 0.5
			} else {
				words[i].end = lineEnd
			}
		}

		return words
	}

	/**
	 * @param {number} time - Time in seconds (eg: 10.200: 10seconds 200millis)
	 * @returns {Object|null} - { lineIndex, wordIndex, word, line }
	 */
	getLocationAtTime(time) {
		if (this.parsedLines.length === 0) {
			return null
		}

		let low = 0,
			high = this.parsedLines.length - 1
		let foundLine = null

		while (low <= high) {
			const mid = Math.floor((low + high) / 2)
			const line = this.parsedLines[mid]

			if (time >= line.start && time <= line.end) {
				foundLine = line
				break
			} else if (time < line.start) {
				high = mid - 1
			} else {
				low = mid + 1
			}
		}

		if (!foundLine) {
			return null
		}

		let foundWordIndex = -1

		for (let i = 0; i < foundLine.words.length; i++) {
			const word = foundLine.words[i]

			if (time >= word.start && time < word.end) {
				foundWordIndex = i
				break
			}
		}

		return {
			lineIndex: foundLine.index,
			wordIndex: foundWordIndex,
			currentWord:
				foundWordIndex !== -1
					? foundLine.words[foundWordIndex].text
					: null,
			lineObj: foundLine,
		}
	}

	getData() {
		return this.parsedLines
	}
}
