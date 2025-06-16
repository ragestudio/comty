import { useState, useEffect } from "react"

const getDominantColorStr = (analysis) => {
	if (!analysis) return "0,0,0"
	return analysis.value?.join(", ") || "0,0,0"
}

export default (trackManifest) => {
	const [coverAnalysis, setCoverAnalysis] = useState(null)

	useEffect(() => {
		const getCoverAnalysis = async () => {
			const track = app.cores.player.track()

			if (!track?.analyzeCoverColor) {
				return null
			}

			try {
				const analysis = await track.analyzeCoverColor()
				setCoverAnalysis(analysis)
			} catch (error) {
				console.error("Failed to get cover analysis:", error)
				setCoverAnalysis(null)
			}
		}

		if (trackManifest) {
			getCoverAnalysis()
		} else {
			setCoverAnalysis(null)
		}
	}, [trackManifest])

	return {
		coverAnalysis,
		dominantColor: getDominantColorStr(coverAnalysis),
		cssVars: {
			"--dominant-color": getDominantColorStr(coverAnalysis),
			"--dominant-color-r": coverAnalysis?.value?.[0],
			"--dominant-color-g": coverAnalysis?.value?.[1],
			"--dominant-color-b": coverAnalysis?.value?.[2],
		},
	}
}
