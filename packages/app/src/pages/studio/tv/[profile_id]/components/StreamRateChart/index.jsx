import React, { useEffect, useRef } from "react"
import * as d3 from "d3"

import { formatBitrate } from "../../liveTabUtils"

const CHART_HEIGHT = 220
const MIN_DATA_POINTS_FOR_CHART = 3
const ONE_MINUTE_IN_MS = 1 * 60 * 1000; // 1 minute in milliseconds

const Y_AXIS_MAX_TARGET_KBPS = 14000
const Y_AXIS_DISPLAY_MAX_KBPS = Y_AXIS_MAX_TARGET_KBPS * 1.1
const MAX_Y_DOMAIN_BPS_FROM_CONFIG = (Y_AXIS_DISPLAY_MAX_KBPS * 1000) / 8

const StreamRateChart = ({ streamData }) => {
	const d3ContainerRef = useRef(null)
	const tooltipRef = useRef(null)

	useEffect(() => {
		if (
			streamData &&
			streamData.length >= MIN_DATA_POINTS_FOR_CHART &&
			d3ContainerRef.current
		) {
			const svgElement = d3ContainerRef.current
			const tooltipDiv = d3.select(tooltipRef.current)

			const availableWidth =
				svgElement.clientWidth ||
				(svgElement.parentNode && svgElement.parentNode.clientWidth) ||
				600

			const availableHeight = CHART_HEIGHT

			const margin = { top: 20, right: 20, bottom: 30, left: 75 } // Adjusted right margin
			const width = availableWidth - margin.left - margin.right
			const height = availableHeight - margin.top - margin.bottom

			const svg = d3.select(svgElement)
			svg.selectAll("*").remove()

			// Define a clip-path for the lines area
			svg.append("defs").append("clipPath")
				.attr("id", "chart-lines-clip") // Unique ID for clipPath
				.append("rect")
				.attr("width", width) // Clip to the plotting area width
				.attr("height", height); // Clip to the plotting area height

			// Main chart group for axes (not clipped)
			const chartG = svg
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			// Group for lines, this group will be clipped
			const linesG = chartG.append("g")
				.attr("clip-path", "url(#chart-lines-clip)");

			const xScale = d3
				.scaleTime()
				// Domain will now span the actual data present in streamData (up to 1 minute)
				.domain(d3.extent(streamData, (d) => new Date(d.time))) 
				.range([0, width])

			const currentMaxBps = d3.max(streamData, (d) => d.receivedRate) || 0
			const yDomainMax = Math.max(
				MAX_Y_DOMAIN_BPS_FROM_CONFIG,
				currentMaxBps,
			)

			const yScale = d3
				.scaleLinear()
				.domain([0, yDomainMax > 0 ? yDomainMax : (1000 * 1000) / 8])
				.range([height, 0])
				.nice()

			const xAxis = d3
				.axisBottom(xScale)
				.ticks(Math.min(5, Math.floor(width / 80)))
				.tickFormat(d3.timeFormat("%H:%M:%S"))

			const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatBitrate)

			chartG
				.append("g")
				.attr("class", "x-axis")
				.attr("transform", `translate(0,${height})`)
				.call(xAxis)
				.selectAll("text")
				.style("fill", "#8c8c8c")
			chartG.selectAll(".x-axis path").style("stroke", "#444")
			chartG.selectAll(".x-axis .tick line").style("stroke", "#444")

			chartG
				.append("g")
				.attr("class", "y-axis")
				.call(yAxis)
				.selectAll("text")
				.style("fill", "#8c8c8c")
			chartG.selectAll(".y-axis path").style("stroke", "#444")
			chartG.selectAll(".y-axis .tick line").style("stroke", "#444")

			const lineReceived = d3
				.line()
				.x((d) => xScale(new Date(d.time)))
				.y((d) => yScale(d.receivedRate))
				.curve(d3.curveMonotoneX)

			const receivedColor = "#2ecc71"

			// Filter data to ensure valid points for the line
			const validStreamDataForLine = streamData.filter(
				d => d && typeof d.receivedRate === 'number' && !isNaN(d.receivedRate) && d.time
			);

			// Append the line path to the clipped group 'linesG'
			// Only draw if there's enough valid data to form a line
			if (validStreamDataForLine.length > 1) {
				linesG 
					.append("path")
					.datum(validStreamDataForLine)
					.attr("fill", "none")
					.attr("stroke", receivedColor)
					.attr("stroke-width", 2)
					.attr("d", lineReceived);
					// curveMonotoneX is applied in the lineReceived generator definition
			}

			// Tooltip focus elements are appended to chartG so they are not clipped by the lines' clip-path
			const focus = chartG 
				.append("g")
				.attr("class", "focus")
				.style("display", "none")

			focus
				.append("line")
				.attr("class", "focus-line")
				.attr("y1", 0)
				.attr("y2", height)
				.attr("stroke", "#aaa")
				.attr("stroke-width", 1)
				.attr("stroke-dasharray", "3,3")

			focus
				.append("circle")
				.attr("r", 4)
				.attr("class", "focus-circle-received")
				.style("fill", receivedColor)
				.style("stroke", "white")

			chartG
				.append("rect")
				.attr("class", "overlay")
				.attr("width", width)
				.attr("height", height)
				.style("fill", "none")
				.style("pointer-events", "all")
				.on("mouseover", () => {
					focus.style("display", null)
					tooltipDiv.style("display", "block")
				})
				.on("mouseout", () => {
					focus.style("display", "none")
					tooltipDiv.style("display", "none")
				})
				.on("mousemove", mousemove)

			const bisectDate = d3.bisector((d) => new Date(d.time)).left

			function mousemove(event) {
				const [mouseX] = d3.pointer(event, this)

				const x0 = xScale.invert(mouseX)
				const i = bisectDate(streamData, x0, 1)
				const d0 = streamData[i - 1]
				const d1 = streamData[i]

				const t0 = d0 ? new Date(d0.time) : null
				const t1 = d1 ? new Date(d1.time) : null
				const d = t1 && x0 - t0 > t1 - x0 ? d1 : d0

				if (d) {
					const focusX = xScale(new Date(d.time))
					focus.attr("transform", `translate(${focusX},0)`)
					focus
						.select(".focus-circle-received")
						.attr("cy", yScale(d.receivedRate))

					const tooltipX = margin.left + focusX + 15
					const receivedY = yScale(d.receivedRate)
					const tooltipY = margin.top + receivedY

					tooltipDiv
						.style("left", `${tooltipX}px`)
						.style("top", `${tooltipY}px`)
						.html(
							`<strong>Time:</strong> ${d3.timeFormat("%H:%M:%S")(new Date(d.time))}<br/>` +
								`<strong>Received:</strong> ${formatBitrate(d.receivedRate)}`,
						)
				}
			}
		} else if (d3ContainerRef.current) {
			const svg = d3.select(d3ContainerRef.current)

			svg.selectAll("*").remove()

			if (streamData && streamData.length < MIN_DATA_POINTS_FOR_CHART) {
				const currentSvgElement = d3ContainerRef.current

				svg.append("text")
					.attr(
						"x",
						(currentSvgElement?.clientWidth ||
							(currentSvgElement?.parentNode &&
								currentSvgElement?.parentNode.clientWidth) ||
							600) / 2,
					)
					.attr("y", CHART_HEIGHT / 2)
					.attr("text-anchor", "middle")
					.text(
						`Collecting data... (${streamData?.length || 0}/${MIN_DATA_POINTS_FOR_CHART})`,
					)
					.style("fill", "#8c8c8c")
					.style("font-size", "12px")
			}
		}
	}, [streamData])

	return (
		<div
			style={{
				width: "100%",
				height: `${CHART_HEIGHT}px`,
				position: "relative",
			}}
		>
			<svg
				ref={d3ContainerRef}
				style={{ width: "100%", height: "100%", display: "block" }}
			></svg>

			<div
				ref={tooltipRef}
				style={{
					position: "absolute",
					display: "none",
					padding: "8px",
					background: "rgba(0,0,0,0.75)",
					color: "white",
					borderRadius: "4px",
					pointerEvents: "none",
					fontSize: "12px",
					zIndex: 10,
				}}
			></div>

			{(!streamData || streamData.length === 0) && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: `${CHART_HEIGHT}px`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						color: "#8c8c8c",
						zIndex: 1,
					}}
				>
					Waiting for stream data...
				</div>
			)}
		</div>
	)
}

export default StreamRateChart
