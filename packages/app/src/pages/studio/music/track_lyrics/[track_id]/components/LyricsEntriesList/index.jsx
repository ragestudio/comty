import React from "react"
import { Typography, Input } from "antd"
import { useVirtualizer } from "@tanstack/react-virtual"
import Line from "../LyricsEntriesItem"

const { Text } = Typography

const VirtualizedLyricsList = React.memo(
	({
		lines,
		lineIndex,
		editData,
		setEditData,
		handleSeek,
		handleDeleteLine,
		handleEditLineStart,
		handleEditLineSave,
		handleEditLineCancel,
		handleClickDuplicate,
	}) => {
		const linesListRef = React.useRef(null)
		const scrollToTime = React.useCallback((time) => {
			const lineSelector = `#t${parseInt(time * 1000)}`
			const lineElement =
				linesListRef.current?.querySelector(lineSelector)
			if (lineElement) {
				lineElement.scrollIntoView({ behavior: "smooth" })
			}
		}, [])

		const virtualizer = useVirtualizer({
			count: lines.length,
			getScrollElement: () => linesListRef.current,
			estimateSize: React.useCallback(() => 60, []),
			overscan: 3,
		})

		// scroll to active line when it changes
		React.useEffect(() => {
			if (lineIndex !== null && lineIndex !== -1) {
				const line = lines[lineIndex]

				if (line) {
					const timeoutId = setTimeout(() => {
						scrollToTime(line.time)
					}, 100)

					return () => clearTimeout(timeoutId)
				}
			}
		}, [lineIndex, lines, scrollToTime])

		if (lines.length === 0) {
			return (
				<div
					className="avlyrics-editor-list"
					style={{
						height: "500px",
						overflow: "auto",
						position: "relative",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text type="secondary">No lyrics to display</Text>
				</div>
			)
		}

		return (
			<div
				className="avlyrics-editor-list"
				ref={linesListRef}
				style={{
					height: "500px",
					overflow: "auto",
					position: "relative",
				}}
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const line = lines[virtualItem.index]

						return (
							<div
								key={line.key}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
							>
								<Line
									line={line}
									active={virtualItem.index === lineIndex}
									setEditData={setEditData}
									editData={editData}
									handleSeek={handleSeek}
									handleDeleteLine={handleDeleteLine}
									handleEditLineStart={handleEditLineStart}
									handleEditLineSave={handleEditLineSave}
									handleEditLineCancel={handleEditLineCancel}
									handleClickDuplicate={handleClickDuplicate}
								/>
							</div>
						)
					})}
				</div>
			</div>
		)
	},
)

VirtualizedLyricsList.displayName = "VirtualizedLyricsList"

export default VirtualizedLyricsList
