import React from "react"
import HoverReveal from "@ui/HoverReveal"
import { Icons } from "@components/Icons"

function getIndicators(track, playerState) {
	const indicators = []

	if (playerState.live) {
		indicators.push({
			icon: <Icons.RadioTower style={{ color: "var(--colorPrimary)" }} />,
		})
	}

	if (playerState.format_metadata && playerState.format_metadata?.trackInfo) {
		const dmuxData = playerState.format_metadata

		const trackInfo = dmuxData.trackInfo[0]
		const trackAudio = trackInfo?.audio

		const codec = trackInfo?.codecName ?? dmuxData.codec
		const sampleRate = trackAudio?.samplingFrequency ?? dmuxData.sampleRate
		const bitDepth = trackAudio?.bitDepth ?? dmuxData.bitsPerSample
		const bitrate = trackAudio?.bitrate ?? dmuxData.bitrate

		if (codec) {
			if (codec.toLowerCase().includes("flac")) {
				indicators.push({
					icon: <Icons.Lossless />,
					tooltip: (
						<span>
							{sampleRate / 1000}kHz / {bitDepth ?? 16} Bits
						</span>
					),
				})
			}

			if (codec.toLowerCase().includes("vorbis")) {
				indicators.push({
					icon: <Icons.Ogg />,
					tooltip: (
						<span>
							{sampleRate / 1000} kHz / {bitrate / 1000}
							kbps
						</span>
					),
				})
			}
		}
	}

	return indicators
}

const Indicators = ({ track, playerState }) => {
	if (!track) {
		return null
	}

	const indicators = React.useMemo(
		() => getIndicators(track, playerState),
		[track, playerState],
	)

	if (indicators.length === 0) {
		return null
	}

	return (
		<div className="toolbar_player_indicators_wrapper">
			<div className="toolbar_player_indicators">
				{indicators.map((indicator, index) => {
					if (indicator.tooltip) {
						return (
							<HoverReveal
								key={index}
								children={indicator.icon}
								component={indicator.tooltip}
							/>
						)
					}

					return React.cloneElement(indicator.icon, {
						key: index,
					})
				})}
			</div>
		</div>
	)
}

export default Indicators
