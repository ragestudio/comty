import { useState, useEffect, useRef } from "react"

const SMA_WINDOW_SIZE = 10
const FLUCTUATION_THRESHOLD_PERCENT = 50

export const useStreamSignalQuality = (streamHealth, targetMaxBitrateBps) => {
	const [signalQuality, setSignalQuality] = useState({
		status: "Calculating...",
		message: "Waiting for stream data to assess stability.",
		color: "orange",
		currentReceivedRateBps: 0,
		currentSentRateBps: 0,
	})

	const previousSampleRef = useRef(null)
	const receivedBitrateHistoryRef = useRef([])

	useEffect(() => {
		if (
			streamHealth &&
			typeof streamHealth.bytesSent === "number" &&
			typeof streamHealth.bytesReceived === "number"
		) {
			const currentTime = new Date()

			let calculatedSentRateBps = 0
			let calculatedReceivedRateBps = 0

			if (previousSampleRef.current) {
				const timeDiffSeconds =
					(currentTime.getTime() -
						previousSampleRef.current.time.getTime()) /
					1000

				if (timeDiffSeconds > 0.1) {
					calculatedSentRateBps = Math.max(
						0,
						(streamHealth.bytesSent -
							previousSampleRef.current.totalBytesSent) /
							timeDiffSeconds,
					)
					calculatedReceivedRateBps = Math.max(
						0,
						(streamHealth.bytesReceived -
							previousSampleRef.current.totalBytesReceived) /
							timeDiffSeconds,
					)
				}
			}

			const newHistory = [
				...receivedBitrateHistoryRef.current,
				calculatedReceivedRateBps,
			].slice(-SMA_WINDOW_SIZE)

			receivedBitrateHistoryRef.current = newHistory

			let newStatus = "Calculating..."
			let newMessage = `Gathering incoming stream data (${newHistory.length}/${SMA_WINDOW_SIZE})...`
			let newColor = "geekblue"

			if (newHistory.length >= SMA_WINDOW_SIZE / 2) {
				const sum = newHistory.reduce((acc, val) => acc + val, 0)
				const sma = sum / newHistory.length

				if (sma > 0) {
					const fluctuationPercent =
						(Math.abs(calculatedReceivedRateBps - sma) / sma) * 100

					if (fluctuationPercent > FLUCTUATION_THRESHOLD_PERCENT) {
						newStatus = "Unstable"
						newMessage = `Incoming bitrate fluctuating significantly (±${fluctuationPercent.toFixed(0)}%).`
						newColor = "red"
					} else if (
						calculatedReceivedRateBps <
						targetMaxBitrateBps * 0.1
					) {
						newStatus = "Low Incoming Bitrate"
						newMessage = "Incoming stream bitrate is very low."
						newColor = "orange"
					} else {
						newStatus = "Good"
						newMessage = "Incoming stream appears stable."
						newColor = "green"
					}
				} else if (calculatedReceivedRateBps > 0) {
					newStatus = "Good"
					newMessage = "Incoming stream started."
					newColor = "green"
				} else {
					newStatus = "No Incoming Data"
					newMessage = "No incoming data transmission detected."
					newColor = "red"
				}
			}

			setSignalQuality({
				status: newStatus,
				message: newMessage,
				color: newColor,
				currentReceivedRateBps: calculatedReceivedRateBps,
				currentSentRateBps: calculatedSentRateBps,
			})

			previousSampleRef.current = {
				time: currentTime,
				totalBytesSent: streamHealth.bytesSent,
				totalBytesReceived: streamHealth.bytesReceived,
			}
		} else {
			setSignalQuality({
				status: "No Data",
				message: "Stream health information is not available.",
				color: "grey",
				currentReceivedRateBps: 0,
				currentSentRateBps: 0,
			})
			previousSampleRef.current = null
			receivedBitrateHistoryRef.current = []
		}
	}, [streamHealth, targetMaxBitrateBps])

	return signalQuality
}
